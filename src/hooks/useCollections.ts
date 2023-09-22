import type { ApiPromise } from '@polkadot/api';
import type {
  PalletNftsCollectionRole,
  PalletNftsCollectionSetting,
  PalletNftsPreSignedMint,
} from '@polkadot/types/lookup';
import type { AnyJson } from '@polkadot/types/types';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAccounts } from '@contexts/AccountsContext.tsx';
import { useModalStatus } from '@contexts/ModalStatusContext.tsx';

import { ModalStatusTypes, NFT_PALLETS, SUPPORTED_ATTRIBUTE_KEYS, StatusMessages } from '@helpers/config.ts';
import { handleError } from '@helpers/handleError.ts';
import {
  CollectionAttribute,
  CollectionConfig,
  CollectionConfigJson,
  CollectionInfo,
  CollectionMetadata,
  CollectionMetadataRecordNfts,
  CollectionMetadataRecordUniques,
  CollectionMigrationSnapshot,
  CollectionParsedMetadata,
  CollectionRoles,
  CollectionSnapshot,
  MappedCollection,
  NftMigrationData,
  SnapshotSignature,
} from '@helpers/interfaces.ts';
import { routes } from '@helpers/routes.ts';
import {
  BitFlags,
  fetchJson,
  getCidHash,
  getEnumOptions,
  getFetchableMetadataUrl,
  getFetchableUrl,
  stringOrNothing,
} from '@helpers/utilities.ts';

export const useCollections = () => {
  const { api, activeAccount, activeWallet } = useAccounts();
  const navigate = useNavigate();
  const { openModalStatus, setStatus, setAction } = useModalStatus();
  const [ownedNftsCollections, setOwnedNftsCollections] = useState<CollectionMetadata[] | null>(null);
  const [ownedUniquesCollections, setOwnedUniquesCollections] = useState<CollectionMetadata[] | null>(null);
  const [mappedCollections, setMappedCollections] = useState<MappedCollection[] | null>(null);
  const [collectionNftsMetadata, setCollectionNftsMetadata] = useState<CollectionMetadata | null>(null);
  const [collectionUniquesMetadata, setCollectionUniquesMetadata] = useState<CollectionMetadata | null>(null);
  const [collectionNftsRoles, setCollectionNftsRoles] = useState<CollectionRoles | null>(null);
  const [collectionUniquesRoles, setCollectionUniquesRoles] = useState<CollectionRoles | null>(null);
  const [collectionNftsAttributes, setCollectionNftsAttributes] = useState<CollectionAttribute[] | null>(null);
  const [collectionUniquesAttributes, setCollectionUniquesAttributes] = useState<CollectionAttribute[] | null>(null);
  const [isCollectionMetadataLoading, setIsCollectionMetadataLoading] = useState(false);
  const [migrationDataStatus, setMigrationDataStatus] = useState('');
  const [migrationData, setMigrationData] = useState<NftMigrationData[] | null>(null);

  const getOwnedCollectionIds = useCallback(
    async (pallet: NFT_PALLETS) => {
      if (api && activeAccount) {
        const results =
          pallet === 'nfts'
            ? await api.query.nfts.collectionAccount.keys(activeAccount.address)
            : await api.query.uniques.classAccount.keys(activeAccount.address);

        const collectionIds = results
          .map(({ args: [, collectionId] }) => collectionId)
          .sort((a, b) => a.cmp(b) * -1)
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

  const fetchMetadataFromIpfs = (cid: unknown) => {
    const url = getFetchableMetadataUrl(cid);
    if (!url) return null;

    return fetchJson(url).then((res: AnyJson) => {
      if (!res || typeof res !== 'object' || Array.isArray(res)) return null;

      res.image = getCidHash(res.image) || undefined;
      res.name = stringOrNothing(res.name);
      res.description = stringOrNothing(res.description);

      return res as CollectionParsedMetadata;
    });
  };

  const fetchSnapshotFromIpfs = (cid: unknown, customProvider?: string) => {
    const url = getFetchableUrl(cid, customProvider);
    if (!url) return null;

    return fetchJson(url).then((res: AnyJson) => {
      if (!res || typeof res !== 'object' || Array.isArray(res)) return null;

      if (!res?.signer || typeof res.signer !== 'string' || !Array.isArray(res.signatures)) return null;

      res.sourceCollection = stringOrNothing(res.sourceCollection);
      res.targetCollection = stringOrNothing(res.targetCollection);

      const signatures: SnapshotSignature[] = [];
      for (const record of res.signatures) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) continue;

        const data = stringOrNothing(record.data);
        const signature = stringOrNothing(record.signature);

        if (data && signature) {
          signatures.push({ data, signature });
        }
      }

      // @ts-ignore
      res.signatures = signatures;

      return res as unknown as CollectionMigrationSnapshot;
    });
  };

  const fetchCollectionsInfo = useCallback(
    async (pallet: NFT_PALLETS, collections: string[]): Promise<Map<string, CollectionInfo> | null> => {
      if (!api) return null;

      const records =
        pallet === 'nfts'
          ? await api.query.nfts.collection.multi(collections)
          : await api.query.uniques.class.multi(collections);

      const results = new Map();

      if (Array.isArray(records) && records.length > 0) {
        records.forEach((rawData, index) => {
          if (!rawData.isSome) return;
          const data = rawData.unwrap();

          const collectionId = collections[index];
          const items = data.items.toNumber();
          const owner = data.owner.toString();

          results.set(collectionId, { items, owner });
        });
      }

      return results;
    },
    [api],
  );

  const fetchCollectionsMetadata = useCallback(
    async (pallet: NFT_PALLETS, collections: string[]): Promise<Array<CollectionMetadata | null> | null> => {
      if (!api) return null;

      let results = null;

      const records =
        pallet === 'nfts'
          ? await api.query.nfts.collectionMetadataOf.multi(collections)
          : await api.query.uniques.classMetadataOf.multi(collections);

      const collectionsInfo = await fetchCollectionsInfo(pallet, collections);

      if (Array.isArray(records) && records.length > 0) {
        results = await Promise.all(
          records.map(async (rawMetadata, index) => {
            let metadataIsLocked = false;
            let attributesAreLocked = false;
            let metadataLink = '';
            const collectionId = collections[index];

            if (pallet === 'uniques') {
              if (rawMetadata.isSome) {
                const metadataInfo = rawMetadata.toPrimitive() as unknown as CollectionMetadataRecordUniques;
                metadataLink = metadataInfo.data;
                metadataIsLocked = metadataInfo.isFrozen;
                attributesAreLocked = metadataInfo.isFrozen;
              }
            } else {
              if (rawMetadata.isSome) {
                const metadataInfo = rawMetadata.toPrimitive() as unknown as CollectionMetadataRecordNfts;
                metadataLink = metadataInfo?.data;
              }

              const config = await getCollectionConfig(collectionId);
              if (!config?.isSome) {
                return null;
              }

              type CollectionSettings = PalletNftsCollectionSetting['type'];
              const collectionConfig = config.unwrap().toJSON() as unknown as CollectionConfigJson;
              const options = getEnumOptions(api, 'PalletNftsCollectionSetting') as CollectionSettings[];
              const settings = new BitFlags<CollectionSettings>(options, true);

              metadataIsLocked = !settings.has('UnlockedMetadata', collectionConfig.settings);
              attributesAreLocked = !settings.has('UnlockedAttributes', collectionConfig.settings);
            }

            return {
              id: collectionId,
              metadataLink,
              metadataIsLocked,
              attributesAreLocked,
              items: collectionsInfo?.get(collectionId)?.items || 0,
              owner: collectionsInfo?.get(collectionId)?.owner || '',
            } as CollectionMetadata;
          }),
        );
      }
      return results;
    },
    [api, fetchCollectionsInfo, getCollectionConfig],
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

          if (Array.isArray(metadataRecords) && metadataRecords.length > 0) {
            const otherPallet: NFT_PALLETS = pallet === 'nfts' ? 'uniques' : 'nfts';
            const ownedCollectionIdsInOtherPallet = await getOwnedCollectionIds(otherPallet);
            let otherPalletCollectionsMetadata: string[] = [];

            if (ownedCollectionIdsInOtherPallet) {
              otherPalletCollectionsMetadata = await fetchCollectionsMetadata(
                otherPallet,
                ownedCollectionIdsInOtherPallet,
              ).then((data) => {
                if (!data) return [];
                return data.map((metadata) => metadata?.metadataLink || '');
              });
            }

            const fetchCalls = metadataRecords.map((metadata) => {
              return fetchMetadataFromIpfs(metadata?.metadataLink);
            });
            const fetchedData = await Promise.allSettled(fetchCalls);

            collections = fetchedData
              .map((result, index) => {
                if (!metadataRecords[index]) return null;
                const data = result.status === 'fulfilled' ? result.value : null;
                const isMapped =
                  !!metadataRecords[index]?.metadataLink &&
                  otherPalletCollectionsMetadata.includes(metadataRecords[index]?.metadataLink as string);

                return {
                  ...metadataRecords[index],
                  isMapped,
                  json: data || undefined,
                };
              })
              .filter(Boolean) as CollectionMetadata[];
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

  const getMappedCollections = useCallback(async () => {
    if (api) {
      let result: MappedCollection[] = [];

      try {
        // first, we need to get all the collections with metadata from the uniques pallet
        const uniquesCollections = new Map<string, { metadata: string; owner: string }>();
        const uniquesCollectionsWithMetadata = new Map<string, string>(); // { collectionId: metadata}
        const uniquesMetadataQuery = await api.query.uniques.classMetadataOf.entries();
        for (const record of uniquesMetadataQuery) {
          const [
            {
              args: [collectionId],
            },
            data,
          ] = record;
          if (!data.isSome) continue;
          const metadata = data.unwrap().data.toPrimitive() as string;
          if (!metadata) continue;
          uniquesCollectionsWithMetadata.set(collectionId.toString(), metadata);
        }

        if (uniquesCollectionsWithMetadata.size === 0) {
          setMappedCollections(result);
          return;
        }

        // next, we group found collections by owner
        const collectionIds = [...uniquesCollectionsWithMetadata.keys()];
        const uniquesCollectionsByOwner = new Map<string, string[]>(); // { owner => Array<collectionId> }
        const uniquesCollectionsQuery = await api.query.uniques.class.multi(collectionIds);
        uniquesCollectionsQuery.forEach((record, index) => {
          if (!record.isSome) return;
          const owner = record.unwrap().owner.toString();
          const id = collectionIds[index];
          uniquesCollections.set(id, { metadata: uniquesCollectionsWithMetadata.get(id)!, owner });
          uniquesCollectionsByOwner.set(owner, [...(uniquesCollectionsByOwner.get(owner) || []), id]);
        });

        // now, we need to get all the collections created by collected owners in the pallet-nfts
        const uniquesOwners = [...uniquesCollectionsByOwner.keys()];
        const nftsCollectionToOwner = new Map<string, string>(); // { collectionId, owner }
        const allNftsCollectionIds: string[] = [];

        for (const owner of uniquesOwners) {
          const ownerCollectionsQuery = await api.query.nfts.collectionAccount.keys(owner);
          const ownerCollections = ownerCollectionsQuery.map(({ args: [, collectionId] }) => collectionId.toString());

          allNftsCollectionIds.push(...ownerCollections);

          for (const collectionId of ownerCollections) {
            nftsCollectionToOwner.set(collectionId, owner);
          }
        }

        // attach the metadata for found pallet-nfts collections
        const nftsCollections = new Map<string, { metadata: string; owner: string }>();
        const nftsCollectionMetadataQuery = await api.query.nfts.collectionMetadataOf.multi(allNftsCollectionIds);
        nftsCollectionMetadataQuery.forEach((record, index) => {
          if (!record.isSome) return;
          const id = allNftsCollectionIds[index];
          const metadata = record.unwrap().data.toPrimitive() as string;
          const owner = nftsCollectionToOwner.get(id);
          if (!metadata || !owner) return;
          nftsCollections.set(id, { metadata, owner });
        });

        // group by owner to ease the further mapping
        const nftsCollectionsByOwner = new Map<string, { id: string; metadata: string }[]>();
        for (const [collectionId, data] of nftsCollections.entries()) {
          const records = nftsCollectionsByOwner.get(data.owner) || [];
          records.push({ id: collectionId, metadata: data.metadata });
          nftsCollectionsByOwner.set(data.owner, records);
        }

        // map collections by metadata and owner
        const metadataLinks = new Set<string>();
        const mappedUniquesCollections = [...uniquesCollections.entries()].reduce((memo, [collectionId, data]) => {
          const matchedCollections = (nftsCollectionsByOwner.get(data.owner) || [])
            .filter(({ metadata }) => metadata === data.metadata)
            .sort(({ id: id1 }, { id: id2 }) => Number(id2) - Number(id1)); // in descending order

          if (matchedCollections.length) {
            memo.add({
              sourceCollection: collectionId,
              targetCollection: matchedCollections[0].id,
              metadataLink: data.metadata,
            });
            metadataLinks.add(data.metadata);
          }

          return memo;
        }, new Set<MappedCollection>());

        // fetch the metadata from mapped collections
        const fetchMetadataLinks = [...metadataLinks.values()];
        const fetchCalls = fetchMetadataLinks.map(fetchMetadataFromIpfs);
        const fetchedData = await Promise.allSettled(fetchCalls);
        const metadataToResult = new Map<string, CollectionParsedMetadata>();

        fetchedData.forEach((result, index) => {
          if (!fetchMetadataLinks[index] || result.status !== 'fulfilled' || !result.value) return;

          const metadataLink = fetchMetadataLinks[index];
          metadataToResult.set(metadataLink, result.value);
        });

        // attach the fetched metadata to mapped collections
        result = [...mappedUniquesCollections.values()].map((mappedCollection) => ({
          ...mappedCollection,
          json: metadataToResult.get(mappedCollection.metadataLink),
        }));
      } catch (error) {
        console.error(error);
      }

      setMappedCollections(result);
    }
  }, [api]);

  const getCollectionMetadata = useCallback(
    async (collectionId: string, pallet: NFT_PALLETS) => {
      const updateState = pallet === 'nfts' ? setCollectionNftsMetadata : setCollectionUniquesMetadata;

      if (api && collectionId) {
        setIsCollectionMetadataLoading(true);

        try {
          const metadata = await fetchCollectionsMetadata(pallet, [collectionId]);

          if (metadata && metadata[0]) {
            const fetchedData = await fetchMetadataFromIpfs(metadata[0].metadataLink);
            if (fetchedData) {
              metadata[0].json = fetchedData;
            }
            updateState(metadata[0]);
          } else {
            updateState(null);
          }
        } catch (error) {
          updateState(null);
        } finally {
          setIsCollectionMetadataLoading(false);
        }
      } else {
        updateState(null);
      }
    },
    [api, fetchCollectionsMetadata],
  );

  const fetchCollectionRoles = useCallback(
    async (collectionId: string, pallet: NFT_PALLETS): Promise<CollectionRoles | null> => {
      let result: CollectionRoles | null = null;

      if (api && collectionId) {
        try {
          switch (pallet) {
            case 'uniques': {
              const collection = await api.query.uniques.class(collectionId);
              result = {};
              if (collection.isSome) {
                const roles = collection.unwrap();
                result.admin = roles.admin.toString();
                result.issuer = roles.issuer.toString();
                result.freezer = roles.freezer.toString();
              }
              break;
            }
            case 'nfts': {
              const query = await api.query.nfts.collectionRoleOf.entries(collectionId);
              const collectionRoles = query.map(
                ([
                  {
                    args: [, account],
                  },
                  data,
                ]) => ({
                  account: account.toString(),
                  roles: data.unwrapOrDefault().toNumber(),
                }),
              );
              result = {};
              if (collectionRoles.length) {
                type CollectionRole = PalletNftsCollectionRole['type'];
                const rolesBitflags = new BitFlags<CollectionRole>(
                  getEnumOptions(api, 'PalletNftsCollectionRole') as CollectionRole[],
                );

                for (const record of collectionRoles) {
                  if (rolesBitflags.has('Admin', record.roles)) {
                    result.admin = record.account;
                  }
                  if (rolesBitflags.has('Issuer', record.roles)) {
                    result.issuer = record.account;
                  }
                  if (rolesBitflags.has('Freezer', record.roles)) {
                    result.freezer = record.account;
                  }
                }
              }
            }
          }
        } catch (error) {
          //
        }
      }

      return result;
    },
    [api],
  );

  const getCollectionRoles = useCallback(
    async (collectionId: string, pallet: NFT_PALLETS) => {
      const updateState = pallet === 'nfts' ? setCollectionNftsRoles : setCollectionUniquesRoles;
      const result = await fetchCollectionRoles(collectionId, pallet);
      updateState(result);
    },
    [fetchCollectionRoles],
  );

  const fetchCollectionAttributes = useCallback(
    async (collectionId: string, pallet: NFT_PALLETS): Promise<CollectionAttribute[] | null> => {
      let result: CollectionAttribute[] | null = null;

      if (api && collectionId) {
        try {
          switch (pallet) {
            case 'uniques': {
              const query = await api.query.uniques.attribute.entries(collectionId, null);
              result = query.map(
                ([
                  {
                    args: [, , key],
                  },
                  data,
                ]) => {
                  const value = data.isSome ? data.unwrap()[0].toPrimitive() : '';
                  return {
                    key: key.toPrimitive() as string,
                    value: value as string,
                  };
                },
              );
              break;
            }
            case 'nfts': {
              const query = await api.query.nfts.attribute.entries(collectionId, null, 'CollectionOwner');
              result = query.map(
                ([
                  {
                    args: [, , , key],
                  },
                  data,
                ]) => {
                  const value = data.isSome ? data.unwrap()[0].toPrimitive() : '';
                  return {
                    key: key.toPrimitive() as string,
                    value: value as string,
                  };
                },
              );
            }
          }
        } catch (error) {
          //
        }
      }

      return result;
    },
    [api],
  );

  const getCollectionAttributes = useCallback(
    async (collectionId: string, pallet: NFT_PALLETS) => {
      const updateState = pallet === 'nfts' ? setCollectionNftsAttributes : setCollectionUniquesAttributes;
      const result = await fetchCollectionAttributes(collectionId, pallet);
      updateState(result);
    },
    [fetchCollectionAttributes],
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
    async (
      collectionConfig: CollectionConfig,
      collectionMetadata: string,
      admin: string,
      settingsAfter: number | null,
    ) => {
      if (api && activeAccount && activeWallet) {
        setStatus({ type: ModalStatusTypes.INIT_TRANSACTION, message: StatusMessages.TRANSACTION_CONFIRM });
        openModalStatus();

        try {
          const unsub = await api.tx.nfts
            .create(admin, collectionConfig)
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

  const updateTeam = useCallback(
    async (pallet: NFT_PALLETS, collectionId: string, team: CollectionRoles) => {
      if (api && activeAccount && activeWallet) {
        setStatus({ type: ModalStatusTypes.INIT_TRANSACTION, message: StatusMessages.TRANSACTION_CONFIRM });
        openModalStatus();

        let tx;
        switch (pallet) {
          case 'nfts':
            tx = api.tx.nfts.setTeam(collectionId, team.issuer || null, team.admin || null, team.freezer || null);
            break;

          case 'uniques':
            tx = api.tx.uniques.setTeam(collectionId, team.issuer || '', team.admin || '', team.freezer || '');
        }

        try {
          const unsub = await tx.signAndSend(
            activeAccount.address,
            { signer: activeWallet.signer },
            ({ events, status }) => {
              if (status.isReady) {
                setStatus({ type: ModalStatusTypes.IN_PROGRESS, message: StatusMessages.UPDATING_TEAM });
              }

              if (status.isInBlock) {
                unsub();
                events.some(({ event: { method } }) => {
                  if (method === 'TeamChanged') {
                    setStatus({ type: ModalStatusTypes.COMPLETE, message: StatusMessages.TEAM_UPDATED });
                    return true;
                  }

                  if (method === 'ExtrinsicFailed') {
                    setStatus({ type: ModalStatusTypes.ERROR, message: StatusMessages.ACTION_FAILED });

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
    [api, activeAccount, activeWallet, setStatus, openModalStatus],
  );

  const addAttributeTx = (
    api: ApiPromise,
    pallet: NFT_PALLETS,
    collectionId: string,
    attributeKey: SUPPORTED_ATTRIBUTE_KEYS,
    attributeValue: string,
  ) => {
    switch (pallet) {
      case 'nfts':
        return api.tx.nfts.setAttribute(collectionId, null, 'CollectionOwner', attributeKey, attributeValue);

      case 'uniques':
        return api.tx.uniques.setAttribute(collectionId, null, attributeKey, attributeValue);
    }
  };

  const removeAttributeTx = (
    api: ApiPromise,
    pallet: NFT_PALLETS,
    collectionId: string,
    attributeKey: SUPPORTED_ATTRIBUTE_KEYS,
  ) => {
    switch (pallet) {
      case 'nfts':
        return api.tx.nfts.clearAttribute(collectionId, null, 'CollectionOwner', attributeKey);

      case 'uniques':
        return api.tx.uniques.clearAttribute(collectionId, null, attributeKey);
    }
  };

  const attachSnapshot = useCallback(
    async (
      pallet: NFT_PALLETS,
      collectionId: string,
      newValues: CollectionSnapshot,
      oldValues: CollectionSnapshot,
      collectionRoles: CollectionRoles,
    ) => {
      if (api && activeAccount && activeWallet) {
        setStatus({ type: ModalStatusTypes.INIT_TRANSACTION, message: StatusMessages.TRANSACTION_CONFIRM });
        openModalStatus();

        const txs = [];

        // in the pallet-nfts in order to update the attributes you need to have an Admin role
        const needToChangeRole = activeAccount.address !== collectionRoles.admin && pallet === 'nfts';
        if (needToChangeRole) {
          txs.push(
            api.tx.nfts.setTeam(
              collectionId,
              collectionRoles.issuer || null,
              activeAccount.address,
              collectionRoles.freezer || null,
            ),
          );
        }

        if (newValues.link) {
          txs.push(addAttributeTx(api, pallet, collectionId, SUPPORTED_ATTRIBUTE_KEYS.SNAPSHOT, newValues.link));
        } else if (oldValues.link) {
          txs.push(removeAttributeTx(api, pallet, collectionId, SUPPORTED_ATTRIBUTE_KEYS.SNAPSHOT));
        }
        if (newValues.provider) {
          txs.push(addAttributeTx(api, pallet, collectionId, SUPPORTED_ATTRIBUTE_KEYS.PROVIDER, newValues.provider));
        } else if (oldValues.provider) {
          txs.push(removeAttributeTx(api, pallet, collectionId, SUPPORTED_ATTRIBUTE_KEYS.PROVIDER));
        }

        if (needToChangeRole) {
          txs.push(
            api.tx.nfts.setTeam(
              collectionId,
              collectionRoles.issuer || null,
              collectionRoles.admin || null,
              collectionRoles.freezer || null,
            ),
          );
        }

        try {
          const unsub = await api.tx.utility
            .batchAll(txs)
            .signAndSend(activeAccount.address, { signer: activeWallet.signer }, ({ events, status }) => {
              if (status.isReady) {
                setStatus({ type: ModalStatusTypes.IN_PROGRESS, message: StatusMessages.ATTACHING_SNAPSHOT });
              }

              if (status.isInBlock) {
                unsub();
                events.some(({ event: { method } }) => {
                  if (method === 'AttributeCleared' || method === 'AttributeSet') {
                    setStatus({ type: ModalStatusTypes.COMPLETE, message: StatusMessages.SNAPSHOT_ATTACHED });
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
    [api, activeAccount, activeWallet, setStatus, openModalStatus],
  );

  const validateOwnedCollection = useCallback(
    async (collectionId: string, pallet: NFT_PALLETS) => {
      let result = false;
      if (api && activeAccount) {
        switch (pallet) {
          case 'nfts': {
            const collection = await api.query.nfts.collection(collectionId);
            if (collection.isSome && collection.unwrap().owner.eq(activeAccount.address)) {
              result = true;
            }
            break;
          }
          case 'uniques': {
            const collection = await api.query.uniques.class(collectionId);
            if (collection.isSome && collection.unwrap().owner.eq(activeAccount.address)) {
              result = true;
            }
            break;
          }
        }
      }

      return result;
    },
    [api, activeAccount],
  );

  const loadMigrationData = useCallback(
    async (sourceCollectionId: string, targetCollectionId: string) => {
      setMigrationData(null);

      if (api && activeAccount) {
        setMigrationDataStatus('Reading attributes...');
        let snapshotLink;
        let snapshotProvider;

        const sourceCollectionAttributes = await fetchCollectionAttributes(sourceCollectionId, 'uniques');
        if (sourceCollectionAttributes) {
          snapshotLink = sourceCollectionAttributes.find((item) => item.key === SUPPORTED_ATTRIBUTE_KEYS.SNAPSHOT)
            ?.value;
          snapshotProvider = sourceCollectionAttributes.find((item) => item.key === SUPPORTED_ATTRIBUTE_KEYS.PROVIDER)
            ?.value;
        }

        if (!snapshotLink) {
          const targetCollectionAttributes = await fetchCollectionAttributes(targetCollectionId, 'nfts');
          if (targetCollectionAttributes) {
            snapshotLink = targetCollectionAttributes.find((item) => item.key === SUPPORTED_ATTRIBUTE_KEYS.SNAPSHOT)
              ?.value;
            snapshotProvider = targetCollectionAttributes.find((item) => item.key === SUPPORTED_ATTRIBUTE_KEYS.PROVIDER)
              ?.value;
          }
        }

        if (!snapshotLink) {
          return setMigrationDataStatus('Unable to find the snapshot record in collection attributes.');
        }

        setMigrationDataStatus('Snapshot record found, fetching the data...');
        const snapshotData = await fetchSnapshotFromIpfs(snapshotLink, snapshotProvider);

        if (!snapshotData) {
          return setMigrationDataStatus('Unable to fetch snapshot`s data.');
        }

        if (!snapshotData.signer) {
          return setMigrationDataStatus('Signer`s address needs to be specified in the snapshot`s data.');
        }

        if (snapshotData.sourceCollection && snapshotData.sourceCollection !== sourceCollectionId) {
          return setMigrationDataStatus('`sourceCollection` field in the snapshot points to another collection.');
        }

        if (snapshotData.targetCollection && snapshotData.targetCollection !== targetCollectionId) {
          return setMigrationDataStatus('`targetCollection` field in the snapshot points to another collection.');
        }

        // validate the signer field
        const roles = await fetchCollectionRoles(targetCollectionId, 'nfts');
        if (!roles?.admin || !roles?.issuer) {
          return setMigrationDataStatus(
            'Collection`s owner disabled the Admin/Issuer accounts, NFTs migration is not possible.',
          );
        }

        if (roles.admin !== snapshotData.signer || roles.issuer !== snapshotData.signer) {
          return setMigrationDataStatus(
            'An account used to sign the snapshot must have the Admin and Issuer roles within the collection.',
          );
        }

        // reconstruct nft objects from the signature data
        const MAX_CLAIMS = 100;
        const activeBlockNumber = (await api.derive.chain.bestNumber()).toNumber();
        const now = (await api.rpc.chain.getHeader()).number.toNumber();
        console.log({ activeBlockNumber, now });
        let foundNfts: NftMigrationData[] = [];

        for (const { data, signature } of snapshotData.signatures) {
          const preSignedMint: PalletNftsPreSignedMint = api.createType('PalletNftsPreSignedMint', data);

          if (
            preSignedMint.mintPrice.isSome ||
            preSignedMint.collection.toString() !== targetCollectionId ||
            preSignedMint.onlyAccount.unwrapOrDefault().toString() !== activeAccount.address
          ) {
            continue;
          }

          if (foundNfts.length === MAX_CLAIMS) break;

          const expired = preSignedMint.deadline.toNumber() < now;

          foundNfts.push({
            encodedNft: data,
            signature,
            signer: snapshotData.signer,
            preSignInfo: preSignedMint,
            expired,
            claimed: false,
          });
        }

        // check if claimed
        const nftsQuery = await api.query.nfts.item.multi(
          foundNfts.map((record) => [targetCollectionId, record.preSignInfo.item]),
        );
        if (Array.isArray(nftsQuery) && nftsQuery.length > 0) {
          foundNfts = foundNfts.map((record, index) => ({
            ...record,
            claimed: nftsQuery[index]?.isSome,
          }));
        }

        // fetch metadata
        const fetchCalls = foundNfts.map((record) => {
          return fetchMetadataFromIpfs(record.preSignInfo.metadata.toPrimitive());
        });
        const fetchedData = await Promise.allSettled(fetchCalls);

        fetchedData.forEach((result, index) => {
          const data = result.status === 'fulfilled' ? result.value : null;
          if (foundNfts[index]) {
            foundNfts[index].json = data || undefined;
          }
        });

        setMigrationDataStatus('');
        setMigrationData(foundNfts);
      }
    },
    [api, activeAccount, fetchCollectionAttributes, fetchCollectionRoles],
  );

  const claimNft = useCallback(
    async (data: NftMigrationData) => {
      if (api && activeAccount && activeWallet) {
        setStatus({ type: ModalStatusTypes.INIT_TRANSACTION, message: StatusMessages.TRANSACTION_CONFIRM });
        openModalStatus();

        try {
          const unsub = await api.tx.nfts
            .mintPreSigned(data.preSignInfo, { Sr25519: data.signature }, data.signer)
            .signAndSend(activeAccount.address, { signer: activeWallet.signer }, ({ events, status }) => {
              if (status.isReady) {
                setStatus({ type: ModalStatusTypes.IN_PROGRESS, message: StatusMessages.CLAIMING_NFT });
              }

              if (status.isInBlock) {
                unsub();
                events.some(({ event: { method } }) => {
                  if (method === 'Issued') {
                    setStatus({ type: ModalStatusTypes.COMPLETE, message: StatusMessages.NFT_CLAIMED });
                    setAction(() => () => navigate(0));
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
    [api, activeAccount, activeWallet, setStatus, openModalStatus, setAction, navigate],
  );

  return {
    getCollectionAttributes,
    getCollectionConfig,
    getCollectionMetadata,
    getCollectionRoles,
    getMappedCollections,
    getOwnedCollections,
    createCollection,
    updateTeam,
    attachSnapshot,
    validateOwnedCollection,
    ownedNftsCollections,
    ownedUniquesCollections,
    mappedCollections,
    collectionNftsMetadata,
    collectionUniquesMetadata,
    isCollectionMetadataLoading,
    collectionNftsRoles,
    collectionUniquesRoles,
    collectionNftsAttributes,
    collectionUniquesAttributes,
    loadMigrationData,
    migrationDataStatus,
    migrationData,
    claimNft,
  };
};
