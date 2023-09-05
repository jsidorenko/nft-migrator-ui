import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { saveDataToIpfs } from '@api/pinata.ts';

import { useAccounts } from '@contexts/AccountsContext.tsx';
import { useModalStatus } from '@contexts/ModalStatusContext.tsx';

import { ModalStatusTypes, NFT_PALLETS, StatusMessages } from '@helpers/config.ts';
import { handleError } from '@helpers/handleError.ts';
import {
  CollectionConfig,
  CollectionMetadata,
  CollectionMetadataData,
  CollectionMetadataPrimitive,
} from '@helpers/interfaces.ts';
import { routes } from '@helpers/routes.ts';
import { getCidHash, getCidUrl, getFetchableMetadataUrl, getFetchableUrl } from '@helpers/utilities.ts';

export const useCollections = () => {
  const { api, activeAccount, activeWallet } = useAccounts();
  const navigate = useNavigate();
  const { openModalStatus, setStatus, setAction } = useModalStatus();
  const [ownedNftsCollections, setOwnedNftsCollections] = useState<CollectionMetadata[] | null>(null);
  const [ownedUniquesCollections, setOwnedUniquesCollections] = useState<CollectionMetadata[] | null>(null);
  const [collectionMetadata, setCollectionMetadata] = useState<CollectionMetadata | null>(null);
  const [isCollectionDataLoading, setIsCollectionDataLoading] = useState(false);

  const getOwnedCollectionIds = useCallback(
    async (pallet: NFT_PALLETS = 'nfts') => {
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

  const fetchCollectionsMetadata = useCallback(
    async (pallet: NFT_PALLETS, collections: string[]) => {
      if (!api) return;

      const rawMetadata =
        pallet === 'nfts'
          ? await api.query.nfts.collectionMetadataOf.multi(collections)
          : await api.query.uniques.classMetadataOf.multi(collections);

      if (Array.isArray(rawMetadata) && rawMetadata.length > 0) {
        return rawMetadata.map((data) => {
          const metadata = data.toPrimitive() as unknown as CollectionMetadataPrimitive;
          return metadata?.data || null;
        });
      }
    },
    [api],
  );

  const getOwnedCollections = useCallback(
    async (pallet: NFT_PALLETS) => {
      if (api) {
        setIsCollectionDataLoading(true);
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
            const mappedCollections: Map<string, string> = new Map();

            // TODO: think about naming
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
              };
            });
          }

          updateState(collections);
        } catch (error) {
          console.error(error);
        } finally {
          setIsCollectionDataLoading(false);
        }
      }
    },
    [api, getOwnedCollectionIds, fetchCollectionsMetadata],
  );

  const getCollectionMetadata = useCallback(
    async (collectionId: string) => {
      if (api && collectionId) {
        setIsCollectionDataLoading(true);

        try {
          let metadata: CollectionMetadata | null = null;

          const ownedCollectionIds = await getOwnedCollectionIds();
          if (!ownedCollectionIds || !ownedCollectionIds.includes(collectionId)) {
            return;
          }

          const rawMetadata = await api.query.nfts.collectionMetadataOf(collectionId);

          if (rawMetadata) {
            const primitiveMetadata = rawMetadata.toPrimitive() as unknown as CollectionMetadataPrimitive;
            if (!primitiveMetadata?.data) {
              return null;
            }

            const fetchedData = await fetch(getFetchableUrl(primitiveMetadata.data));

            metadata = await fetchedData.json();
            if (metadata?.image) {
              metadata.image = getCidHash(metadata.image);
            }
          }

          setCollectionMetadata(metadata);
        } catch (error) {
          //
        } finally {
          setIsCollectionDataLoading(false);
        }
      } else {
        setCollectionMetadata(null);
      }
    },
    [api, getOwnedCollectionIds],
  );

  const saveCollectionMetadata = useCallback(
    async (collectionId: string, collectionMetadata: CollectionMetadataData) => {
      if (api && activeAccount && activeWallet) {
        setStatus({ type: ModalStatusTypes.INIT_TRANSACTION, message: StatusMessages.TRANSACTION_CONFIRM });
        openModalStatus();

        try {
          if (collectionMetadata.image) {
            collectionMetadata.image = getCidUrl(collectionMetadata.image);
          }

          const cid = await saveDataToIpfs(collectionMetadata);
          const metadataCid = getCidUrl(cid);

          const unsub = await api.tx.nfts
            .setCollectionMetadata(collectionId, metadataCid)
            .signAndSend(activeAccount.address, { signer: activeWallet.signer }, ({ events, status }) => {
              if (status.isReady) {
                setStatus({ type: ModalStatusTypes.IN_PROGRESS, message: StatusMessages.METADATA_UPDATING });
              }

              if (status.isInBlock) {
                unsub();

                events.some(({ event: { method } }) => {
                  if (method === 'ExtrinsicSuccess') {
                    setStatus({ type: ModalStatusTypes.COMPLETE, message: StatusMessages.METADATA_UPDATED });
                    setAction(() => () => navigate(routes.myAssets.mintNftMain));

                    return true;
                  }

                  if (method === 'ExtrinsicFailed') {
                    setStatus({ type: ModalStatusTypes.ERROR, message: StatusMessages.ACTION_FAILED });
                    setAction(() => () => navigate(routes.myAssets.mintNftMain));

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
    [api, activeAccount, activeWallet, setStatus, openModalStatus, setAction, navigate],
  );

  const createCollection = useCallback(
    async (collectionConfig: CollectionConfig, collectionMetadata: CollectionMetadataData) => {
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
                    saveCollectionMetadata(mintedCollectionId, collectionMetadata);

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
    [api, activeAccount, activeWallet, setStatus, openModalStatus, saveCollectionMetadata],
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

  return {
    getOwnedCollections,
    getCollectionMetadata,
    saveCollectionMetadata,
    createCollection,
    ownedNftsCollections,
    ownedUniquesCollections,
    collectionMetadata,
    isCollectionDataLoading,
    getCollectionConfig,
  };
};
