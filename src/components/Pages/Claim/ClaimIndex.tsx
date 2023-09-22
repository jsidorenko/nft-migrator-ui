import { memo, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { styled } from 'styled-components';

import Title from '@common/Title.tsx';

import { mediaQueries } from '@helpers/reusableStyles.ts';
import { alternateBackground } from '@helpers/utilities.ts';

import ClaimSteps from './ClaimSteps.tsx';

const SOutlet = styled.div`
  margin-top: 40px;

  @media ${mediaQueries.tablet} {
    margin-top: 52px;
  }
`;

const MintNftIndex = () => {
  useEffect(() => {
    return alternateBackground();
  }, []);

  return (
    <>
      <Title className='main'>Migrate your NFTs</Title>
      <ClaimSteps />
      <SOutlet>
        <Outlet />
      </SOutlet>
    </>
  );
};

export default memo(MintNftIndex);
