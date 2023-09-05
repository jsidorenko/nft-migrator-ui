import { memo } from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';

import Connect from '@common/Connect.tsx';

import { useAccounts } from '@contexts/AccountsContext.tsx';

import {
  CssFontRegularL,
  CssFontRegularM,
  CssFontRegularS,
  CssFontSemiBoldL,
  SActionButton,
  SContentBlockContainer,
  mediaQueries,
} from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';
import { SCard } from '@helpers/styledComponents.ts';

const SIntroText = styled.div`
  ${CssFontRegularM}

  max-width: 320px;
  margin: 0 auto;
  text-align: center;
  color: ${({ theme }) => theme.textAndIconsSecondary};

  @media ${mediaQueries.tablet} {
    ${CssFontRegularL}
    max-width: 624px;
  }

  @media ${mediaQueries.laptop} {
    max-width: 820px;
  }

  @media ${mediaQueries.desktop} {
    max-width: 924px;
  }
`;

const SConnect = styled.div`
  display: inline-block;
`;

const SLinkCard = styled(SCard)`
  cursor: pointer;

  .card-img {
    border-radius: 12px;
  }

  .card-title {
    ${CssFontSemiBoldL}
  }

  .card-text {
    ${CssFontRegularS}
    color: ${({ theme }) => theme.textAndIconsTertiary}
  }
`;

const SStepsContainer = styled(SContentBlockContainer)`
  justify-content: center;

  .footer {
    background: none;
  }
`;

const SStepButton = styled(SActionButton)`
  &.secondary {
    height: 32px;
  }
`;

const Main = () => {
  const { activeAccount } = useAccounts();
  const navigate = useNavigate();
  return (
    <>
      <SIntroText>
        Migrate your NFTs from the pallet-uniques to the pallet-nfts.
        <br />
        <br />
        {!activeAccount && (
          <>
            Please connect to start{' '}
            <SConnect>
              <Connect />
            </SConnect>
          </>
        )}
        {activeAccount && (
          <SStepsContainer>
            <SLinkCard onClick={() => navigate(routes.myAssets.collections)}>
              <Card.Body>
                <Card.Title>For collection owners</Card.Title>
                <Card.Text className='mb-4 mt-4'>I want to prepare my collection for the migration process</Card.Text>
              </Card.Body>
              <Card.Footer className='footer'>
                <SStepButton className='secondary'>Start</SStepButton>
              </Card.Footer>
            </SLinkCard>
            <SLinkCard onClick={() => navigate(routes.myAssets.index)}>
              <Card.Body>
                <Card.Title>For NFT owners</Card.Title>
                <Card.Text className='mb-4 mt-4'>I want to migrate my NFTs</Card.Text>
              </Card.Body>
              <Card.Footer className='footer'>
                <SStepButton className='secondary'>Start</SStepButton>
              </Card.Footer>
            </SLinkCard>
          </SStepsContainer>
        )}
      </SIntroText>
    </>
  );
};

export default memo(Main);
