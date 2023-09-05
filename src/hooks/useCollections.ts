import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { saveDataToIpfs } from '@api/pinata.ts';

import { useAccounts } from '@contexts/AccountsContext.tsx';
import { useModalStatus } from '@contexts/ModalStatusContext.tsx';

import { ModalStatusTypes, StatusMessages } from '@helpers/config.ts';
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
  const [ownedCollections, setOwnedCollections] = useState<CollectionMetadata[] | null>(null);
  const [collectionMetadata, setCollectionMetadata] = useState<CollectionMetadata | null>(null);
  const [isCollectionDataLoading, setIsCollectionDataLoading] = useState(false);

  const getCollectionIds = useCallback(async () => {
    if (api && activeAccount) {
      const results = await api.query.nfts.collectionAccount.keys(activeAccount.address);

      const collectionIds = results
        .map(({ args: [, collectionId] }) => collectionId)
        .sort((a, b) => a.cmp(b))
        .map((collectionId) => collectionId.toString());

      if (collectionIds.length > 0) {
        return collectionIds;
      }
    }

    return null;
  }, [api, activeAccount]);

  const getOwnedCollections = useCallback(async () => {
    if (api) {
      setIsCollectionDataLoading(true);

      try {
        let collections: CollectionMetadata[] = [];

        const ownedCollectionIds = await getCollectionIds();
        if (!ownedCollectionIds) {
          setOwnedCollections(collections);
          return;
        }

        const rawMetadata = await api.query.nfts.collectionMetadataOf.multi(ownedCollectionIds);

        if (Array.isArray(rawMetadata) && rawMetadata.length > 0) {
          const metadataRecords = rawMetadata.map((data) => {
            const metadata = data.toPrimitive() as unknown as CollectionMetadataPrimitive;
            return metadata?.data || null;
          });

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
            };
          });
        }

        setOwnedCollections(collections);
      } catch (error) {
        //
      } finally {
        setIsCollectionDataLoading(false);
      }
    }
  }, [api, getCollectionIds]);

  const getCollectionMetadata = useCallback(
    async (collectionId: string) => {
      if (api && collectionId) {
        setIsCollectionDataLoading(true);

        try {
          let metadata: CollectionMetadata | null = null;

          const ownedCollectionIds = await getCollectionIds();
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
    [api, getCollectionIds],
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
    ownedCollections,
    collectionMetadata,
    isCollectionDataLoading,
    getCollectionConfig,
  };
};
