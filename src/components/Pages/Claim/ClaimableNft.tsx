import { memo } from 'react';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

import ActionButton from '@buttons/ActionButton.tsx';

import ShowImage from '@common/ShowImage.tsx';

import { CollectionMetadata, NftMigrationData } from '@helpers/interfaces.ts';
import { CssFontRegularS, CssFontRegularXS, CssFontSemiBoldL } from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';

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

const SId = styled.div`
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

interface ClaimableNftProps {
  data: NftMigrationData;
  onClaim: () => void;
}

const ClaimableNft = ({ data, onClaim }: ClaimableNftProps) => {
  const { name, image } = data.json || {};
  const nftId = data.preSignInfo.item.toNumber();

  return (
    <tr>
      <STableImage>
        <ShowImage imageCid={image} altText='' />
      </STableImage>
      <td>
        <SName>{name || '- no title -'}</SName>
        <SId>Id: {nftId}</SId>
      </td>
      <td align='right'>
        {data.claimed && <ReadyButton className='main-light w-100'>Claimed</ReadyButton>}
        {data.expired && (
          <ReadyButton className='secondary w-100' disabled>
            Expired
          </ReadyButton>
        )}
        {!data.claimed && !data.expired && (
          <ActionButton type='button' className='secondary w-100' action={onClaim}>
            Claim
          </ActionButton>
        )}
      </td>
    </tr>
  );
};

export default memo(ClaimableNft);
