import { useEffect } from 'react';

import { useCollections } from '@hooks/useCollections.ts';

export const useLoadOwnedNftsCollections = () => {
  const { getOwnedCollections, ownedNftsCollections } = useCollections();

  useEffect(() => {
    getOwnedCollections('nfts');
  }, [getOwnedCollections]);

  return ownedNftsCollections;
};

export const useLoadOwnedUniquesCollections = () => {
  const { getOwnedCollections, ownedUniquesCollections } = useCollections();

  useEffect(() => {
    getOwnedCollections('uniques');
  }, [getOwnedCollections]);

  return ownedUniquesCollections;
};

export const useLoadMappedCollections = () => {
  const { getMappedCollections, mappedCollections } = useCollections();

  useEffect(() => {
    getMappedCollections();
  }, [getMappedCollections]);

  return mappedCollections;
};
