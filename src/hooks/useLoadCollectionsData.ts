import { useEffect } from 'react';

import { useCollections } from '@hooks/useCollections.ts';

export const useLoadOwnedCollections = () => {
  const { getOwnedCollections, ownedCollections } = useCollections();

  useEffect(() => {
    getOwnedCollections();
  }, [getOwnedCollections]);

  return ownedCollections;
};
