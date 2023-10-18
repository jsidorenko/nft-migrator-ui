import { PalletNftsPreSignedMint } from '@polkadot/types/lookup';

import { ChainThemes, ChainTitles, MintTypes, ModalStatusTypes, RestrictionTypes, StatusMessages } from './config.ts';

// ==========
// INTERFACES
// ==========
export interface CommonStyleProps {
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  required?: boolean;
  title?: string;
}

export interface CollectionMetadata {
  id: string;
  metadataLink: string;
  isMapped?: boolean;
  json?: CollectionParsedMetadata;
  metadataIsLocked: boolean;
  attributesAreLocked: boolean;
  items: number;
  owner: string;
}

export interface MappedCollection {
  sourceCollection: string;
  targetCollection: string;
  metadataLink: string;
  json?: CollectionParsedMetadata;
}

export interface CollectionParsedMetadata {
  name?: string;
  description?: string;
  image?: string;
}

export interface CollectionMigrationSnapshot {
  sourceCollection?: string;
  targetCollection?: string;
  signer: string;
  signatures: SnapshotSignature[];
}

export interface SnapshotSignature {
  data: string;
  signature: string;
}

export interface NftMigrationData {
  encodedNft: string;
  signature: string;
  signer: string;
  preSignInfo: PalletNftsPreSignedMint;
  expired: boolean;
  claimed: boolean;
  json?: CollectionParsedMetadata;
}

export interface CollectionMetadataRecordNfts {
  data: string;
  deposit: string;
}

export interface CollectionMetadataRecordUniques {
  data: string;
  deposit: string;
  isFrozen: boolean;
}

export interface CollectionInfo {
  items: number;
  owner: string;
}

export interface CollectionConfig {
  settings: number;
  maxSupply?: number;
  mintSettings: {
    mintType: MintType;
    price?: string;
    startBlock?: number;
    endBlock?: number;
    defaultItemSettings: number;
  };
}

export interface CollectionConfigJson {
  settings: number;
  maxSupply: number | null;
  mintSettings: {
    mintType: MintTypeJson;
    price: string | null;
    startBlock: number | null;
    endBlock: number | null;
    defaultItemSettings: number;
  };
}

export interface CollectionRoles {
  admin?: string;
  issuer?: string;
  freezer?: string;
}

export interface CollectionAttribute {
  key: string;
  value: string;
}

export interface CollectionSnapshot {
  link?: string;
  provider?: string;
}

export interface AttachAttributesModalData {
  collectionId: string;
  attributesAreLocked: boolean;
}

export interface ActiveAccount {
  wallet: string;
  account: string;
}

export interface Chain {
  url: string;
  title: ChainTitles;
  theme: ChainThemes;
}

export interface ThemeStyle {
  backgroundSystem: string;
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  textAndIconsPrimary: string;
  textAndIconsSecondary: string;
  textAndIconsTertiary: string;
  textAndIconsDisabled: string;

  fill80: string;
  fill48: string;
  fill30: string;
  fill25: string;
  fill24: string;
  fill18: string;
  fill12: string;
  fill10: string;
  fill8: string;
  fill6: string;

  appliedOverlay: string;
  appliedHover: string;
  appliedStroke: string;
  appliedSeparator: string;
  appliedButtonMain: string;
  appliedLightPinkBackground: string;
  appliedPinkHover: string;
  appliedPinkActive: string;

  accentsPink: string;
  accentsRed: string;
  accentsGreen: string;

  forcedWhite: string;
  forcedBlack: string;
}

export interface StatusEntry {
  type: ModalStatusTypes;
  message: StatusMessages | string;
}

export interface RestrictionMessage {
  type: RestrictionTypes;
  message: string;
}

export interface NftWitnessData {
  mintPrice?: string;
  ownedItem?: string;
}

// =====
// TYPES
// =====
export type MintType = MintTypes | { [MintTypes.HOLDER_OF]: string };

export type MintTypeJson = Record<'public' | 'issuer' | 'holderOf', null | number>;
