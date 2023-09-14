# nft-migrator-ui

## - Work in progress - 

[//]: # (currently published @ https://nft-portal.netlify.app)

The code is based on: https://github.com/paritytech/nft-portal

## Prerequisites to run locally
install netlify CLI globally

```shell
npm install netlify-cli -g
```

## start the dapp
```shell
npm install
npm start
```

TODO:

- [X] on login send to the flow selector
- [X] try to open the private page when being not logged in
- [ ] check Not found page
- [X] flow selector (owner/user)
- [X] define routes/pages
  /my-collections/pallet-uniques
  /my-collections/pallet-nfts
- owner:
  - [X] my collections in the uniques pallet (change the title to represent the pallet)
  - [X] icon if the collection is migrated (find the same collection by the same owner)
  - [X] button to migrate (clone to pallet-nfts)
  - [ ] attach a snapshot
  - [X] show metadata
  - [X] collections in the nfts pallet
  - [X] create new collection page (read src_collection param), for metadata just leave an input field
  - [X] change team
- user:
  - [ ] source collection's selector (separate page)
  - [ ] target collection's selector (read the attribute or try to find by metadata and find the attribute + validate the owner)

