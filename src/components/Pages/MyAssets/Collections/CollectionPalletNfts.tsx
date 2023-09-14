import { memo } from 'react';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

import ActionButton from '@buttons/ActionButton.tsx';

import ShowImage from '@common/ShowImage.tsx';

import { CollectionMetadata } from '@helpers/interfaces.ts';
import { CssFontRegularS, CssFontRegularXS, CssFontSemiBoldL } from '@helpers/reusableStyles.ts';

import { useCountOwnedNfts } from '@hooks/useCountOwnedNfts.ts';

import LockIcon from '@images/icons/lock.svg';

const STableImage = styled.td`
  width: 100px;
`;

const SName = styled.div`
  ${CssFontSemiBoldL};
`;

const SMapped = styled.div`
  ${CssFontRegularXS};
  color: ${({ theme }) => theme.textAndIconsSecondary};
`;

const SCounter = styled.div`
  ${CssFontRegularS};
`;

interface CollectionRowProps {
  collection: CollectionMetadata;
  onChangeTeam: () => void;
}

const CollectionRow = ({ collection, onChangeTeam }: CollectionRowProps) => {
  const { id, json, isMapped, attributesAreLocked } = collection;
  const { name, image } = json || {};
  const counter = useCountOwnedNfts(id);

  return (
    <tr>
      <STableImage>
        <ShowImage imageCid={image} altText='' />
      </STableImage>
      <td>
        <SName>{name || '- no title -'}</SName>
        <SMapped>
          Mapped: <b>{isMapped ? 'yes' : 'no'}</b>
        </SMapped>
        <SCounter>{counter}</SCounter>
      </td>
      <td align='center' className='w-25'>
        <ActionButton type='button' className='stroke w-100' action={onChangeTeam}>
          Change admin
        </ActionButton>
      </td>
      <td align='right' className='w-25'>
        <Link to='..'>
          <ActionButton type='button' className='stroke w-100'>
            <span>
              {attributesAreLocked && <LockIcon className='me-lg-1 mb-1' />}
              Attach snapshot
            </span>
          </ActionButton>
        </Link>
      </td>
    </tr>
  );
};

export default memo(CollectionRow);
