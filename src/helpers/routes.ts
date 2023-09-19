const COLLECTION_ID_PARAM = ':collectionId';
const SOURCE_COLLECTION_ID_PARAM = ':sourceCollectionId';
const DESTINATION_COLLECTION_ID_PARAM = ':destinationCollectionId';
const NFT_ID_PARAM = ':nftId';

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
      destinationCollectionId: string = DESTINATION_COLLECTION_ID_PARAM,
    ) => `/claim-nft/${sourceCollectionId}-${destinationCollectionId}/`,
  },

  myAssets: {
    index: '/my-assets',

    mintNftMain: '/my-assets/mint-nft',
    createCollection: '/my-assets/mint-nft/create-collection',
    mintNft: (collectionId: string = COLLECTION_ID_PARAM) => `/my-assets/mint-nft/${collectionId}/mint`,

    collections: '/my-assets/collections',
    nfts: (collectionId: string = COLLECTION_ID_PARAM) => `/my-assets/collections/${collectionId}/nfts`,
    nftEdit: (collectionId: string = COLLECTION_ID_PARAM, nftId: string = NFT_ID_PARAM) =>
      `/my-assets/collections/${collectionId}/nfts/edit/${nftId}`,
  },
};
