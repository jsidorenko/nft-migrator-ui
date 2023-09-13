import type { PalletNftsCollectionSetting } from '@polkadot/types/lookup';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAccounts } from '@contexts/AccountsContext.tsx';
import { useModalStatus } from '@contexts/ModalStatusContext.tsx';

import { ModalStatusTypes, NFT_PALLETS, StatusMessages } from '@helpers/config.ts';
import { handleError } from '@helpers/handleError.ts';
import {
  CollectionConfig,
  CollectionConfigJson,
  CollectionMetadata,
  CollectionMetadataRecordNfts,
  CollectionMetadataRecordUniques,
} from '@helpers/interfaces.ts';
import { routes } from '@helpers/routes.ts';
import {
  BitFlags,
  fetchJson,
  getCidHash,
  getEnumOptions,
  getFetchableMetadataUrl,
  getFetchableUrl,
} from '@helpers/utilities.ts';

export const useCollections = () => {
  const { api, activeAccount, activeWallet } = useAccounts();
  const navigate = useNavigate();
  const { openModalStatus, setStatus, setAction } = useModalStatus();
  const [ownedNftsCollections, setOwnedNftsCollections] = useState<CollectionMetadata[] | null>(null);
  const [ownedUniquesCollections, setOwnedUniquesCollections] = useState<CollectionMetadata[] | null>(null);
  const [collectionNftsMetadata, setCollectionNftsMetadata] = useState<CollectionMetadata | null>(null);
  const [collectionUniquesMetadata, setCollectionUniquesMetadata] = useState<CollectionMetadata | null>(null);
  const [isCollectionMetadataLoading, setIsCollectionMetadataLoading] = useState(false);

  const getOwnedCollectionIds = useCallback(
    async (pallet: NFT_PALLETS) => {
      if (api && activeAccount) {
        const results =
          pallet === 'nfts'
            ? await api.query.nfts.collectionAccount.keys(activeAccount.address)
            : await api.query.uniques.classAccount.keys(activeAccount.address);

        const collectionIds = results
          .map(({ args: [, collectionId] }) => collectionId)
          .sort((a, b) => a.cmp(b))
          .map((collectionId) => collectionId.toString());

        if (collectionIds.length > 0) {
          return collectionIds;
        }
      }

      return null;
    },
    [api, activeAccount],
  );

  const getCollectionConfig = useCallback(
    async (collectionId: string) => {
      if (api) {
        const config = await api.query.nfts.collectionConfigOf(collectionId);

        return config;
      }
    },
    [api],
  );

  const fetchCollectionsMetadata = useCallback(
    async (pallet: NFT_PALLETS, collections: string[]) => {
      if (!api) return;

      const rawMetadata =
        pallet === 'nfts'
          ? await api.query.nfts.collectionMetadataOf.multi(collections)
          : await api.query.uniques.classMetadataOf.multi(collections);

      if (Array.isArray(rawMetadata) && rawMetadata.length > 0) {
        return rawMetadata.map((data) => {
          const metadata = data.toPrimitive() as unknown as
            | CollectionMetadataRecordUniques
            | CollectionMetadataRecordNfts;
          return metadata?.data || null;
        });
      }
    },
    [api],
  );

  const getOwnedCollections = useCallback(
    async (pallet: NFT_PALLETS) => {
      if (api) {
        setIsCollectionMetadataLoading(true);
        const updateState = pallet === 'nfts' ? setOwnedNftsCollections : setOwnedUniquesCollections;

        try {
          let collections: CollectionMetadata[] = [];

          const ownedCollectionIds = await getOwnedCollectionIds(pallet);

          if (!ownedCollectionIds) {
            updateState(collections);
            return;
          }

          const metadataRecords = await fetchCollectionsMetadata(pallet, ownedCollectionIds);

          if (metadataRecords && metadataRecords.length > 0) {
            const otherPallet: NFT_PALLETS = pallet === 'nfts' ? 'uniques' : 'nfts';
            const ownedCollectionIdsInOtherPallet = await getOwnedCollectionIds(otherPallet);
            const mappedCollections: Map<string, string> = new Map(); // metadata => collection's id (in another pallet)

            if (ownedCollectionIdsInOtherPallet) {
              await fetchCollectionsMetadata(pallet, ownedCollectionIdsInOtherPallet).then((data) => {
                if (!data) return;
                data.forEach((metadata, index) => {
                  if (metadata) {
                    mappedCollections.set(metadata, ownedCollectionIdsInOtherPallet[index]);
                  }
                });
              });
            }

            const fetchCalls = metadataRecords.map((metadata) => {
              if (!metadata) {
                return null;
              }
              return fetch(getFetchableMetadataUrl(metadata)).then((res) => (res.ok ? res.json() : null));
            });
            const fetchedData = await Promise.allSettled(fetchCalls);

            collections = fetchedData.map((result, index) => {
              const data = result.status === 'fulfilled' ? result.value : null;
              return {
                id: ownedCollectionIds[index],
                name: data?.name,
                description: data?.description,
                image: getCidHash(data?.image),
                metadata: metadataRecords[index] || undefined,
                isMapped: !!metadataRecords[index] && mappedCollections.has(metadataRecords[index] as string),
                raw: data ? JSON.stringify(data) : undefined,
              };
            });
          }

          updateState(collections);
        } catch (error) {
          console.error(error);
        } finally {
          setIsCollectionMetadataLoading(false);
        }
      }
    },
    [api, getOwnedCollectionIds, fetchCollectionsMetadata],
  );

  const getCollectionMetadata = useCallback(
    async (collectionId: string, pallet: NFT_PALLETS) => {
      const updateState = pallet === 'nfts' ? setCollectionNftsMetadata : setCollectionUniquesMetadata;

      if (api && collectionId) {
        setIsCollectionMetadataLoading(true);

        try {
          let metadata: CollectionMetadata | null = null;

          const rawMetadata =
            pallet === 'nfts'
              ? await api.query.nfts.collectionMetadataOf(collectionId)
              : await api.query.uniques.classMetadataOf(collectionId);

          if (rawMetadata) {
            let metadataIsLocked = true;
            let attributesAreLocked = true;
            let metadataLink;

            if (pallet === 'uniques') {
              const metadataInfo = rawMetadata.toPrimitive() as unknown as CollectionMetadataRecordUniques;
              metadataLink = metadataInfo.data;
              metadataIsLocked = metadataInfo.isFrozen;
              attributesAreLocked = metadataInfo.isFrozen;
            } else {
              const metadataInfo = rawMetadata.toPrimitive() as unknown as CollectionMetadataRecordNfts;
              metadataLink = metadataInfo.data;

              const config = await getCollectionConfig(collectionId);
              if (!config || !config.isSome) {
                throw new Error('Collection`s config not found');
              }

              type CollectionSettings = PalletNftsCollectionSetting['type'];
              const collectionConfig = config.unwrap().toJSON() as unknown as CollectionConfigJson;
              const options = getEnumOptions(api, 'PalletNftsCollectionSetting') as CollectionSettings[];
              const settings = new BitFlags<CollectionSettings>(options, true);

              metadataIsLocked = !settings.has('UnlockedMetadata', collectionConfig.settings);
              attributesAreLocked = !settings.has('UnlockedAttributes', collectionConfig.settings);
            }

            let fetchedData = null;
            if (metadataLink) {
              fetchedData = await fetchJson(getFetchableUrl(metadataLink));
            }

            metadata = {
              id: collectionId,
              metadataLink,
              metadataIsLocked,
              attributesAreLocked,
              json: fetchedData || undefined,
            };
          }

          updateState(metadata);
        } catch (error) {
          updateState(null);
        } finally {
          setIsCollectionMetadataLoading(false);
        }
      } else {
        updateState(null);
      }
    },
    [api, getCollectionConfig],
  );

  const finishCollectionCreation = useCallback(
    async (collectionId: string, collectionMetadata: string, newCollectionSettings: number | null) => {
      if (api && activeAccount && activeWallet) {
        setStatus({ type: ModalStatusTypes.INIT_TRANSACTION, message: StatusMessages.TRANSACTION_CONFIRM });
        openModalStatus();

        try {
          const txs = [];
          txs.push(api.tx.nfts.setCollectionMetadata(collectionId, collectionMetadata));
          if (newCollectionSettings !== null) {
            txs.push(api.tx.nfts.lockCollection(collectionId, newCollectionSettings));
          }
          const txBatch = api.tx.utility.batchAll(txs);

          const unsub = await txBatch.signAndSend(
            activeAccount.address,
            { signer: activeWallet.signer },
            ({ events, status }) => {
              if (status.isReady) {
                setStatus({ type: ModalStatusTypes.IN_PROGRESS, message: StatusMessages.COLLECTION_CREATED });
              }

              if (status.isInBlock) {
                unsub();

                events.some(({ event: { method } }) => {
                  if (method === 'ExtrinsicSuccess') {
                    setStatus({ type: ModalStatusTypes.COMPLETE, message: StatusMessages.METADATA_UPDATED });
                    setAction(() => () => navigate(routes.myCollections.palletNfts));

                    return true;
                  }

                  if (method === 'ExtrinsicFailed') {
                    setStatus({ type: ModalStatusTypes.ERROR, message: StatusMessages.ACTION_FAILED });
                    setAction(() => () => navigate(routes.myCollections.palletUniques));

                    return true;
                  }

                  return false;
                });
              }
            },
          );
        } catch (error) {
          setStatus({ type: ModalStatusTypes.ERROR, message: handleError(error) });
        }
      }
    },
    [api, activeAccount, activeWallet, setStatus, openModalStatus, setAction, navigate],
  );

  const createCollection = useCallback(
    async (collectionConfig: CollectionConfig, collectionMetadata: string, settingsAfter: number | null) => {
      if (api && activeAccount && activeWallet) {
        setStatus({ type: ModalStatusTypes.INIT_TRANSACTION, message: StatusMessages.TRANSACTION_CONFIRM });
        openModalStatus();

        try {
          const unsub = await api.tx.nfts
            .create(activeAccount.address, collectionConfig)
            .signAndSend(activeAccount.address, { signer: activeWallet.signer }, ({ events, status }) => {
              if (status.isReady) {
                setStatus({ type: ModalStatusTypes.IN_PROGRESS, message: StatusMessages.COLLECTION_CREATING });
              }

              if (status.isInBlock) {
                unsub();
                events.some(({ event: { data, method } }) => {
                  if (method === 'Created') {
                    setStatus({ type: ModalStatusTypes.COMPLETE, message: StatusMessages.COLLECTION_CREATED });
                    const mintedCollectionId = data[0].toString();
                    finishCollectionCreation(mintedCollectionId, collectionMetadata, settingsAfter);

                    return true;
                  }

                  if (method === 'ExtrinsicFailed') {
                    setStatus({ type: ModalStatusTypes.ERROR, message: StatusMessages.ACTION_FAILED });

                    return true;
                  }

                  return false;
                });
              }
            });
        } catch (error) {
          setStatus({ type: ModalStatusTypes.ERROR, message: handleError(error) });
        }
      }
    },
    [api, activeAccount, activeWallet, setStatus, openModalStatus, finishCollectionCreation],
  );

  const validateOwnedCollection = useCallback(
    async (collectionId: string, pallet: NFT_PALLETS) => {
      let result = false;
      if (api && activeAccount) {
        switch (pallet) {
          case 'nfts':
            {
              const collection = await api.query.nfts.collection(collectionId);
              if (collection.isSome && collection.unwrap().owner.eq(activeAccount.address)) {
                result = true;
              }
            }
            break;
          case 'uniques':
            {
              const collection = await api.query.uniques.class(collectionId);
              if (collection.isSome && collection.unwrap().owner.eq(activeAccount.address)) {
                result = true;
              }
            }
            break;
        }
      }

      return result;
    },
    [api, activeAccount],
  );

  return {
    getOwnedCollections,
    getCollectionMetadata,
    createCollection,
    ownedNftsCollections,
    ownedUniquesCollections,
    collectionNftsMetadata,
    collectionUniquesMetadata,
    isCollectionMetadataLoading,
    getCollectionConfig,
    validateOwnedCollection,
  };
};
