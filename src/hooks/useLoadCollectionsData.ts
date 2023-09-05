import { useEffect } from 'react';

import { useCollections } from '@hooks/useCollections.ts';

export const useLoadOwnedCollections = () => {
  const { getOwnedCollections, ownedCollections } = useCollections();

  useEffect(() => {
    getOwnedCollections('nfts');
  }, [getOwnedCollections]);

  return ownedCollections;
};

export const useLoadOwnedUniquesCollections = () => {
  const { getOwnedCollections, ownedUniquesCollections } = useCollections();

  useEffect(() => {
    getOwnedCollections('uniques');
  }, [getOwnedCollections]);

  return ownedUniquesCollections;
};
