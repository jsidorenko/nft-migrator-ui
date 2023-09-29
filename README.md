# NFT migrator UI

[//]: # (currently published @ https://nft-portal.netlify.app)

## Description

It's the web app that helps for the NFT collection owners to prepare their collections for the data migration from the old Uniques pallet to the new NFTs pallet on Polkadot/Kusama Asset Hub.  
For the NFT holders this app simplifies the NFTs migration.

In order to understand the migration process better, please check [this repo](https://github.com/jsidorenko/nft-migrator).

The code is based on [https://github.com/paritytech/nft-portal](https://github.com/paritytech/nft-portal)

## Running locally

### Prerequisites

Install netlify CLI globally

```bash
npm install netlify-cli -g
```

Create a copy of .env file, name it .env.development and fill in the required data:
- `REACT_APP_IPFS_GATEWAY` - IPFS gateway to fetch the snapshot data.
- `REACT_APP_METADATA_GATEWAY` - IPFS gateway to fetch the collections and items metadata.
- `REACT_APP_IMAGES_GATEWAY` - IPFS gateway to fetch the images.

### Start the app
```shell
npm install
npm start
```

## Useful examples

### Generate offchain signatures

```ts
import type { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';

interface SignNFT {
  id: string;
  owner: string;
  metadata: string;
}

const mnemonic = '';
const keyring = new Keyring({type: 'sr25519'});
const signingPair = keyring.createFromUri(mnemonic);

async function signItems(api: ApiPromise, signingPair: KeyringPair, signNfts: SignNFT[], targetCollection: string) {
  const lastBlock = (await api.rpc.chain.getHeader()).number.toNumber();
  const deadline = lastBlock + 10 * 60 * 24 * 365; // one year from now

  const sigs = signNfts.map(({ id, owner, metadata }) => {
    const preSignedMint = api.createType('PalletNftsPreSignedMint', {
      collection: targetCollection,
      item: id,
      attributes: [],
      metadata,
      onlyAccount: owner,
      deadline,
      mintPrice: null,
    });

    const dataHex = preSignedMint.toHex();
    const sig = signingPair.sign(dataHex);

    return {
      data: dataHex,
      signature: u8aToHex(sig),
    };
  });

  return sigs;
}
```

### Put offchain signature into extrinsic
```ts
/* 
  {
    preSignInfo: PalletNftsPreSignedMint;
    signature: string;
    signer: string;
  }
 */
await api.tx.nfts
  .mintPreSigned(preSignInfo, { Sr25519: signature }, signer);

```

### Reconstruct NFT data from the offchain signature

```ts
import type { PalletNftsPreSignedMint } from '@polkadot/types/lookup';

const data = '0x123123...';
const preSignedMint: PalletNftsPreSignedMint = api.createType('PalletNftsPreSignedMint', data);
console.log(preSignedMint.toJSON());
```

### BitFlags
1) [the main library](https://github.com/jsidorenko/nft-migrator-ui/blob/master/src/helpers/BitFlags.ts)
2) [A wrapper to work with the nfts pallet bitflags](https://github.com/jsidorenko/nft-migrator-ui/blob/master/src/helpers/nftBitFlags.ts)

**Retrieve collection roles**
```ts
const query = await api.query.nfts.collectionRoleOf.entries(collectionId);
const collectionRoles = query.map(
  ([
     {
       args: [, account],
     },
     data,
   ]) => ({
    account,
    roles: data.unwrapOrDefault().toNumber(),
  }),
);
result = {};
if (collectionRoles.length) {
  type CollectionRole = PalletNftsCollectionRole['type'];
  const roles = initNftBitFlags<CollectionRole>(api, 'PalletNftsCollectionRole');

  for (const record of collectionRoles) {
    if (roles.has('Admin', record.roles)) {
      result.admin = record.account;
    }
    if (roles.has('Issuer', record.roles)) {
      result.issuer = record.account;
    }
    if (roles.has('Freezer', record.roles)) {
      result.freezer = record.account;
    }
  }
}
```

**Validate a user has a specific role**
```ts
type CollectionRole = PalletNftsCollectionRole['type'];
const roles = initNftBitFlags<CollectionRole>(api, 'PalletNftsCollectionRole');
const accountRoles = (await api.query.nfts.collectionRoleOf(collectionId, userAddress))
  .unwrapOrDefault()
  .toNumber();
if (roles.has('Admin', accountRoles)) {
  //...
}
```

**Construct bitflags for collection settings**
```ts
valuesToNftBitFlags(
  [
    transferableItemsRef.current.checked,
    unlockedMetadataRef.current.checked,
    unlockedAttributesRef.current.checked,
    unlockedMaxSupplyRef.current.checked,
  ],
  'PalletNftsCollectionSetting',
)
```

**Read collection settings**
```ts
type CollectionSetting = PalletNftsCollectionSetting['type'];
const config = await api.query.nfts.collectionConfigOf(collectionId);
if (config.isSome) {
  const collectionConfig = config.unwrap().toJSON() as unknown as CollectionConfigJson;
  const settings = initNftBitFlags<CollectionSetting>(api, 'PalletNftsCollectionSetting');

  const metadataIsLocked = !settings.has('UnlockedMetadata', collectionConfig.settings);
  const attributesAreLocked = !settings.has('UnlockedAttributes', collectionConfig.settings);
}

```
## License

MIT
