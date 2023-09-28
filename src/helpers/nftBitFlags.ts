import { ApiPromise } from '@polkadot/api';
import { getTypeDef } from '@polkadot/types';

import { BitFlags } from '@helpers/BitFlags.ts';

type SupportedBitflagTypes = 'PalletNftsItemSetting' | 'PalletNftsCollectionSetting' | 'PalletNftsCollectionRole';

function isBitFlagsLogicReverted(typeName: SupportedBitflagTypes): boolean {
  let isLogicRevered = false;

  switch (typeName) {
    case 'PalletNftsItemSetting':
    case 'PalletNftsCollectionSetting':
      isLogicRevered = true;
      break;
    case 'PalletNftsCollectionRole':
      break;
    default:
      throw new Error('Unsupported type provided for NftBitFlags');
  }

  return isLogicRevered;
}

const getEnumOptions = (api: ApiPromise, typeName: string): string[] => {
  const { sub } = getTypeDef(api.createType(typeName).toRawType());
  if (!sub || !Array.isArray(sub)) return [];

  return sub
    .sort((a, b) => Number(a.index) - Number(b.index))
    .filter(({ name }) => name && !name.startsWith('__Unused'))
    .map(({ name }) => name as string);
};

export function initNftBitFlags<EnumOptions>(api: ApiPromise, typeName: SupportedBitflagTypes): BitFlags<EnumOptions> {
  const allOptions = getEnumOptions(api, typeName) as EnumOptions[];
  const isLogicRevered = isBitFlagsLogicReverted(typeName);
  return new BitFlags<EnumOptions>(allOptions, isLogicRevered);
}

export function valuesToNftBitFlags(values: boolean[], typeName: SupportedBitflagTypes): number {
  const isLogicRevered = isBitFlagsLogicReverted(typeName);
  return BitFlags.toBitFlag(values, isLogicRevered);
}
