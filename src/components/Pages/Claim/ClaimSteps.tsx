import { truncate } from 'lodash';
import { memo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { styled } from 'styled-components';

import ShowImage from '@common/ShowImage.tsx';
import Step from '@common/Step.tsx';

import { mediaQueries } from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';

import { useCollections } from '@hooks/useCollections.ts';

const SMintNftSteps = styled.div`
  display: inline-block;

  @media ${mediaQueries.tablet} {
    display: flex;
    gap: 8px;
  }
`;

const SSelectedCollection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 36px;
  padding: 0 2px 0 16px;
  color: ${({ theme }) => theme.accentsPink};
  background-color: ${({ theme }) => theme.appliedLightPinkBackground};
  border-radius: 24px;

  .collection-name:last-child {
    padding-right: 14px;
  }
`;

const MintNftSteps = () => {
  const { sourceCollectionId } = useParams();
  const { getCollectionMetadata, collectionUniquesMetadata: collectionMetadata } = useCollections();

  useEffect(() => {
    getCollectionMetadata(sourceCollectionId || '', 'uniques');
  }, [sourceCollectionId, getCollectionMetadata]);

  const selectedCollectionLabel = collectionMetadata ? (
    <SSelectedCollection>
      <span className='collection-name'>{truncate(collectionMetadata.json?.name, { length: 20 })}</span>
      {collectionMetadata.json?.image && <ShowImage imageCid={collectionMetadata.json.image} altText='' />}
    </SSelectedCollection>
  ) : (
    'Select Collection'
  );

  return (
    <SMintNftSteps>
      <Step counter='1' className={sourceCollectionId ? 'disabled' : 'active'}>
        <Link to={routes.claim.index}>{selectedCollectionLabel}</Link>
      </Step>
      <Step counter='2' className={sourceCollectionId ? 'active' : 'disabled'}>
        Claim NFT
      </Step>
    </SMintNftSteps>
  );
};

export default memo(MintNftSteps);
