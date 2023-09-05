import { memo } from 'react';
import { styled } from 'styled-components';

import SelectChain from '@header/SelectChain.tsx';

import LogoButton from './LogoButton.tsx';
import Profile from './Profile.tsx';

const SHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  border: 1px solid ${({ theme }) => theme.appliedStroke};
  border-radius: 48px;
  margin: 0 16px 16px;
  padding: 8px;
`;

const SConnectionBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Header = () => (
  <SHeader>
    <LogoButton />
    <SConnectionBlock>
      <SelectChain />
      <Profile />
    </SConnectionBlock>
  </SHeader>
);

export default memo(Header);
