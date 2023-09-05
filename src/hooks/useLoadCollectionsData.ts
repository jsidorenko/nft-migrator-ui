import { useEffect } from 'react';

import { useCollections } from '@hooks/useCollections.ts';

export const useLoadOwnedCollectionsData = () => {
  const { getOwnedCollectionsData, ownedCollectionsData } = useCollections();

  useEffect(() => {
    getOwnedCollectionsData();
  }, [getOwnedCollectionsData]);

  return ownedCollectionsData;
};
