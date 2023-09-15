import { memo } from 'react';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

import ActionButton from '@buttons/ActionButton.tsx';

import ShowImage from '@common/ShowImage.tsx';

import { CollectionMetadata } from '@helpers/interfaces.ts';
import { CssFontRegularS, CssFontRegularXS, CssFontSemiBoldL } from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';

import { useCountOwnedNfts } from '@hooks/useCountOwnedNfts.ts';

import LockIcon from '@images/icons/lock.svg';

const STableImage = styled.td`
  width: 100px;
`;

const SName = styled.div`
  ${CssFontSemiBoldL};
`;

const SMetadata = styled.div`
  ${CssFontRegularXS};
  color: ${({ theme }) => theme.textAndIconsSecondary};
  max-width: 600px;
  overflow: auto;
`;

const SCounter = styled.div`
  ${CssFontRegularS};
`;

const ReadyButton = styled(ActionButton)`
  &:hover {
    cursor: default !important;
  }
`;

interface CollectionPalletUniquesProps {
  collection: CollectionMetadata;
  onAttachAttributes: () => void;
}

const CollectionPalletUniques = ({ collection, onAttachAttributes }: CollectionPalletUniquesProps) => {
  const { id, json, metadataLink, isMapped, attributesAreLocked } = collection;
  const { name, image } = json || {};

  const counter = useCountOwnedNfts(id);

  return (
    <tr>
      <STableImage>
        <ShowImage imageCid={image} altText='' />
      </STableImage>
      <td>
        <SName>{name || '- no title -'}</SName>
        <SMetadata>Metadata: {metadataLink || '-'}</SMetadata>
        <SCounter>{counter}</SCounter>
      </td>
      <td align='center'>
        {isMapped ? (
          <ReadyButton className='main-light w-100'>Ready</ReadyButton>
        ) : (
          <Link to={routes.myCollections.cloneCollection(id)} className='w-25'>
            <ActionButton type='button' className='secondary w-100'>
              Clone
            </ActionButton>
          </Link>
        )}
      </td>
      <td align='right'>
        <ActionButton type='button' className='stroke w-100' action={onAttachAttributes}>
          <span>
            {attributesAreLocked && <LockIcon className='me-lg-1 mb-1' />}
            Attach snapshot
          </span>
        </ActionButton>
      </td>
    </tr>
  );
};

export default memo(CollectionPalletUniques);
