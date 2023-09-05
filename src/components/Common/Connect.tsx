import { memo, useState } from 'react';
import { styled } from 'styled-components';

import { useAccounts } from '@contexts/AccountsContext.tsx';

import { SConnectButton } from '@helpers/reusableStyles.ts';

import { useConnectToStoredAccount } from '@hooks/useConnectToStoredAccount.ts';
import { useOutsideClick } from '@hooks/useOutsideClick.ts';

import ConnectModal from '@modals/ConnectModal/ConnectModal.tsx';

const SContainer = styled.div`
  position: relative;
`;

const Connect = () => {
  const { activeAccount, wallets } = useConnectToStoredAccount();
  const { setIsAccountActionsVisible } = useAccounts();
  const dropdownRef = useOutsideClick(() => setIsAccountActionsVisible(false));
  const [showWalletSelection, setShowWalletSelection] = useState(false);

  const handleClose = () => setShowWalletSelection(false);
  const handleShow = () => {
    setShowWalletSelection(true);
  };

  if (activeAccount) {
    return null;
  }

  return (
    <>
      <SContainer ref={dropdownRef}>
        <SConnectButton id='connect' className='disconnected' onClick={handleShow}>
          <span>Connect Wallet</span>
        </SConnectButton>
      </SContainer>

      <ConnectModal showWalletSelection={showWalletSelection} handleClose={handleClose} wallets={wallets || []} />
    </>
  );
};

export default memo(Connect);
