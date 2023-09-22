import { Navigate, Route, Routes } from 'react-router-dom';
import { createGlobalStyle, styled } from 'styled-components';

import PrivateRoute from '@common/PrivateRoute.tsx';

import Header from '@header/Header.tsx';

import { ALTERNATE_BACKGROUND_CLASSNAME, mediaQueries } from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';

import ClaimIndex from '@pages/Claim/ClaimIndex.tsx';
import ClaimNft from '@pages/Claim/ClaimNft.tsx';
import SelectCollection from '@pages/Claim/SelectCollection.tsx';
import Main from '@pages/Main/Main.tsx';
import CollectionsPalletNfts from '@pages/ManageCollections/CollectionsPalletNfts.tsx';
import CollectionsPalletUniques from '@pages/ManageCollections/CollectionsPalletUniques.tsx';
import CreateCollection from '@pages/ManageCollections/CreateCollection.tsx';

const SMainContainer = styled.main`
  width: 100%;
  padding: 0 25px;
  color: ${({ theme }) => theme.textAndIconsPrimary};

  @media ${mediaQueries.laptop} {
    width: 900px;
    margin: 0 auto;
  }

  @media ${mediaQueries.desktop} {
    width: 1170px;
  }
`;

const GlobalStyle = createGlobalStyle`
  html, body {
    height: 100%;
  }

  body {
    margin: 0;
    padding: 24px 0 0;
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    background: ${({ theme }) => theme.backgroundSystem};
    color: ${({ theme }) => theme.textAndIconsSecondary};

    &.${ALTERNATE_BACKGROUND_CLASSNAME} {
      background: ${({ theme }) => theme.backgroundPrimary};
    }
  }

  .modal-backdrop {
    background-color: ${({ theme }) => theme.appliedOverlay};
    z-index: 2;

    &.show {
      opacity: 1;
    }
  }
`;

const App = () => (
  <>
    <GlobalStyle />
    <Header />
    <SMainContainer>
      <Routes>
        <Route path={routes.homepage}>
          <Route index element={<Main />} />
        </Route>

        <Route
          path={routes.myCollections.palletNfts}
          element={
            <PrivateRoute>
              <CollectionsPalletNfts />
            </PrivateRoute>
          }
        />

        <Route
          path={routes.myCollections.palletUniques}
          element={
            <PrivateRoute>
              <CollectionsPalletUniques />
            </PrivateRoute>
          }
        />

        <Route
          path={routes.myCollections.cloneCollection()}
          element={
            <PrivateRoute>
              <CreateCollection />
            </PrivateRoute>
          }
        />

        <Route path={routes.claim.index} element={<ClaimIndex />}>
          <Route
            index
            element={
              <PrivateRoute>
                <SelectCollection />
              </PrivateRoute>
            }
          />

          <Route
            path={routes.claim.claimNft()}
            element={
              <PrivateRoute>
                <ClaimNft />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path='*' element={<Navigate to={routes.homepage} replace />} />
      </Routes>
    </SMainContainer>
  </>
);

export default App;
