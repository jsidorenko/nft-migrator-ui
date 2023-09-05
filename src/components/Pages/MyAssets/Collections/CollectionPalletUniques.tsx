import { memo } from 'react';
import { Link } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';

import ActionButton from '@buttons/ActionButton.tsx';

import ShowImage from '@common/ShowImage.tsx';

import { CollectionMetadata } from '@helpers/interfaces.ts';
import { CssFontRegularS, CssFontRegularXS, CssFontSemiBoldL } from '@helpers/reusableStyles.ts';

// import { routes } from '@helpers/routes.ts';
import { useCountOwnedNfts } from '@hooks/useCountOwnedNfts.ts';

const STableImage = styled.td`
  width: 100px;
`;

const SName = styled.div`
  ${CssFontSemiBoldL};
`;

const SMetadata = styled.div`
  ${CssFontRegularXS};
  color: ${({ theme }) => theme.textAndIconsSecondary};
`;

const SCounter = styled.div`
  ${CssFontRegularS};
`;

const ReadyButton = styled(ActionButton)`
  &:hover {
    cursor: default !important;
  }
`;

interface CollectionRowProps {
  collection: CollectionMetadata;
}

const CollectionPalletUniques = ({ collection }: CollectionRowProps) => {
  const { id, name, description, image, metadata, isMapped } = collection;
  const counter = useCountOwnedNfts(id);
  /*const navigate = useNavigate();

  const goIntoCollection = () => {
    navigate(routes.myAssets.nfts(id));
  };*/

  return (
    <tr /* onClick={goIntoCollection}*/>
      <STableImage>
        <ShowImage imageCid={image} altText={description} />
      </STableImage>
      <td>
        <SName>{name || '- no title -'}</SName>
        <SMetadata>Metadata: {metadata || '-'}</SMetadata>
        <SCounter>{counter}</SCounter>
      </td>
      <td align='center'>
        {isMapped ? (
          <ReadyButton className='main-light w-100'>Ready</ReadyButton>
        ) : (
          <Link to='..' className='w-25'>
            <ActionButton type='button' className='secondary w-100'>
              Clone
            </ActionButton>
          </Link>
        )}
      </td>
      <td align='right'>
        <Link to='..' className='w-25'>
          <ActionButton type='button' className='stroke w-100'>
            Attach snapshot
          </ActionButton>
        </Link>
      </td>
    </tr>
  );
};

export default memo(CollectionPalletUniques);
