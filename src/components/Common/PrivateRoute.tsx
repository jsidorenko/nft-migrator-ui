import { ReactElement, memo } from 'react';
import { Navigate } from 'react-router-dom';
import { styled } from 'styled-components';

import Connect from '@common/Connect.tsx';

import { CssFontRegularXL } from '@helpers/reusableStyles.ts';

import { useConnectToStoredAccount } from '@hooks/useConnectToStoredAccount.ts';

const Note = styled.div`
  ${CssFontRegularXL}
  margin-bottom: 32px;
  color: ${({ theme }) => theme.textAndIconsSecondary};
`;

interface PrivateRouteProps {
  children: ReactElement;
  redirectTo?: string;
}

const PrivateRoute = ({ children, redirectTo }: PrivateRouteProps) => {
  const { activeAccount, isAutoConnectDone } = useConnectToStoredAccount();

  if (!isAutoConnectDone) {
    return null;
  }

  if (activeAccount === null && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (activeAccount === null) {
    return (
      <>
        <Note>Connect wallet to see this page</Note>
        <Connect />
      </>
    );
  }

  return children;
};

export default memo(PrivateRoute);
