import { ApiPromise } from '@polkadot/api';
import { getTypeDef } from '@polkadot/types';
import { AnyJson } from '@polkadot/types/types';
import { BN, formatBalance } from '@polkadot/util';
import { ToBn } from '@polkadot/util/types';
import { FormEvent } from 'react';

import { IMAGES_GATEWAY, IPFS_GATEWAY, IPFS_NATIVE_SCHEME, METADATA_GATEWAY } from './config.ts';
import { ALTERNATE_BACKGROUND_CLASSNAME } from './reusableStyles.ts';

export const ellipseAddress = (address = '', charCount = 4): string => {
  if (address === '') {
    return '';
  }

  return `${address.slice(0, charCount)}...${address.slice(-charCount)}`;
};

export const toUint8Array = (data: string) => new TextEncoder().encode(data);

export const getBlockNumber = async (api: ApiPromise, timestamp?: number): Promise<number | undefined> => {
  if (typeof timestamp === 'undefined') {
    return timestamp;
  }

  const blockTime = (api.consts.babe.expectedBlockTime.toPrimitive() as number) / 1000; // in seconds
  const activeBlockNumber = (await api.derive.chain.bestNumber()).toNumber();

  const currentDate = Math.floor(Date.now() / 1000); // current timestamp in seconds
  const laterDate = Math.floor(timestamp / 1000); // user provided timestamp in seconds

  return Math.floor((laterDate - currentDate) / blockTime + activeBlockNumber);
};

export const pricePattern = (maxPrecision: number): string => `^(0|[1-9][0-9]*)([.][0-9]{0,${maxPrecision}})?$`;
export const wholeNumbersPattern = '^[0-9]*$';

export const unitToPlanck = (units: string, decimals: number): string => {
  const separated = units.split('.');
  const [whole] = separated;
  let [, decimal] = separated;

  if (typeof decimal === 'undefined') {
    decimal = '';
  }

  return `${whole}${decimal.padEnd(decimals, '0')}`.replace(/^0+/, '');
};

export const planckToUnit = (planck: string, api: ApiPromise, withSymbol: boolean = false) => {
  const formattedBalance = getCleanFormattedBalance(new BN(planck), api.registry.chainDecimals[0]);

  if (withSymbol) {
    return `${formattedBalance} ${api.registry.chainTokens[0]}`;
  }

  return formattedBalance;
};

export const generateNftId = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const getCleanFormattedBalance = (planck: BN, decimals: number): string => {
  return formatBalance(planck as unknown as ToBn, {
    forceUnit: '-',
    decimals,
    withSi: false,
    withZero: false,
  }).replaceAll(',', '');
};

export const areEqualAddresses = (address1: string, address2: string) => {
  if (typeof address1 !== 'string' || typeof address2 !== 'string') {
    return false;
  }

  return address1.toLowerCase() === address2.toLowerCase();
};

export const handleActionClick = (event: FormEvent, isDisabled?: boolean, action?: () => void) => {
  if (isDisabled) {
    event.preventDefault();
    return;
  }

  if (typeof action !== 'undefined') {
    event.preventDefault();
    action();
  }
};

export const alternateBackground = () => {
  document.body.classList.add(ALTERNATE_BACKGROUND_CLASSNAME);

  return () => document.body.classList.remove(ALTERNATE_BACKGROUND_CLASSNAME);
};

export const getCidUrl = (cid: unknown) => {
  if (typeof cid !== 'string' || cid.startsWith('http')) {
    return cid;
  }

  return `${IPFS_NATIVE_SCHEME}${cid}`;
};

export const getCidHash = (cid: unknown): string => {
  if (typeof cid !== 'string' || !cid) {
    return '';
  } else if (cid.startsWith('http')) {
    return cid;
  }

  // handle V0 CID
  const matchCidV0 = cid.match(/Qm[A-Za-z0-9]{44}(?![A-Za-z0-9])/);
  if (matchCidV0 !== null) {
    return matchCidV0[0];
  }

  // handle V1 CID
  const matchCidV1 = cid.match(/[a-z0-9]{59}(?![A-Za-z0-9])/);
  if (matchCidV1 !== null) {
    return matchCidV1[0];
  }

  return cid;
};

export const getFetchableUrl = (cid: unknown): string => {
  const cidHash = getCidHash(cid);

  if (!cidHash) {
    return '';
  } else if (cidHash.startsWith('http')) {
    return cidHash;
  }

  return `${IPFS_GATEWAY}${cidHash}`;
};

export const getFetchableImageUrl = (cid: unknown): string => {
  const cidHash = getCidHash(cid);

  if (!cidHash) {
    return '';
  } else if (cidHash.startsWith('http')) {
    return cidHash;
  }

  return `${IMAGES_GATEWAY}${cidHash}`;
};

export const getFetchableMetadataUrl = (cid: unknown): string => {
  const cidHash = getCidHash(cid);

  if (!cidHash) {
    return '';
  } else if (cidHash.startsWith('http')) {
    return cidHash;
  }

  return `${METADATA_GATEWAY}${cidHash}`;
};

export const fetchJson = async (url: string, options?: RequestInit): Promise<AnyJson | null> => {
  return fetch(url, options).then((res) => (res.ok ? res.json() : null));
};

export const getEnumOptions = (api: ApiPromise, typeName: string): string[] => {
  const { sub } = getTypeDef(api.createType(typeName).toRawType());
  if (!sub || !Array.isArray(sub)) return [];

  return sub
    .sort((a, b) => Number(a.index) - Number(b.index))
    .filter(({ name }) => name && !name.startsWith('__Unused'))
    .map(({ name }) => name as string);
};

export class BitFlags<OptionsType> {
  flags: Map<OptionsType, number>;
  reverse: boolean;

  // we use the reverse logic for collection and item settings
  // for roles we use the non-reverse logic
  static toBitFlag(values: boolean[], reverseLogic = false): number {
    const bitFlag = values
      .map((value) => (reverseLogic ? +!value : +value))
      .reverse()
      .join('');

    return parseInt(bitFlag, 2);
  }

  constructor(options: Array<OptionsType>, reverse = false) {
    this.reverse = reverse;
    this.flags = options.reduce((memo, value, i) => {
      memo.set(value, 1 << i);
      return memo;
    }, new Map());
  }

  has(checkFlag: OptionsType, value: number): boolean {
    if (!this.flags.has(checkFlag)) {
      throw new Error('Incorrect option provided');
    }

    const result = (value & Number(this.flags.get(checkFlag))) === this.flags.get(checkFlag);
    return this.reverse ? !result : result;
  }
}
