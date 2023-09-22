const COLLECTION_ID_PARAM = ':collectionId';
const SOURCE_COLLECTION_ID_PARAM = ':sourceCollectionId';
const TARGET_COLLECTION_ID_PARAM = ':targetCollectionId';

export const routes = {
  homepage: '/',

  myCollections: {
    palletNfts: '/my-collections/pallet-nfts',
    palletUniques: '/my-collections/pallet-uniques',
    cloneCollection: (collectionId: string = COLLECTION_ID_PARAM) => `/my-collections/clone-collection/${collectionId}`,
  },

  claim: {
    index: '/claim-nft',
    claimNft: (
      sourceCollectionId: string = SOURCE_COLLECTION_ID_PARAM,
      targetCollectionId: string = TARGET_COLLECTION_ID_PARAM,
    ) => `/claim-nft/${sourceCollectionId}/${targetCollectionId}/`,
  },
};
