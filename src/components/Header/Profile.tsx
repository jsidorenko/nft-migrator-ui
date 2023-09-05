import { formatBalance } from '@polkadot/util';
import { truncate } from 'lodash';
import { memo, useEffect } from 'react';
import { styled } from 'styled-components';

import Identicon from '@common/Identicon.tsx';

import { useAccounts } from '@contexts/AccountsContext.tsx';

import { CssFontRegularS, CssFontSemiBoldM, CssFontSemiBoldS, SConnectButton } from '@helpers/reusableStyles.ts';
import { ellipseAddress } from '@helpers/utilities.ts';

import { useConnectToStoredAccount } from '@hooks/useConnectToStoredAccount.ts';
import { useCopyToClipboard } from '@hooks/useCopyToClipboard.ts';
import { useNativeBalance } from '@hooks/useNativeBalance.ts';
import { useOutsideClick } from '@hooks/useOutsideClick.ts';

import CopyIcon from '@images/icons/copy.svg';
import ExitIcon from '@images/icons/exit.svg';

const SContainer = styled.div`
  position: relative;
`;

const SAccountActions = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 16px;
  padding: 24px;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  border-radius: 16px;
  z-index: 1;
  white-space: nowrap;
  box-shadow: 0 2px 8px ${({ theme }) => theme.fill25};

  &.active {
    display: block;
  }

  .regular {
    ${CssFontRegularS}
  }

  .highlighted {
    color: ${({ theme }) => theme.textAndIconsPrimary};
    ${CssFontSemiBoldM}
  }

  a {
    text-decoration: none;
  }
`;

const STopInfo = styled.div`
  padding: 0 8px;
`;

const SSeparator = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.appliedSeparator};
  margin: 12px 0;
`;

const SActionBlock = styled.div`
  display: flex;
  flex-direction: column;

  a {
    color: ${({ theme }) => theme.textAndIconsPrimary};
  }
`;

const SSimpleAction = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  gap: 20px;

  span {
    min-width: 190px;
    height: 40px;
    color: ${({ theme }) => theme.textAndIconsPrimary};
    ${CssFontSemiBoldS}
    line-height: 40px;
  }

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.appliedHover};
    border-radius: 8px;
  }
`;

const SIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background-color: ${({ theme }) => theme.fill6};
  border-radius: 20px;

  svg {
    width: 24px;

    path {
      fill: ${({ theme }) => theme.textAndIconsPrimary};
    }
  }

  &.copied {
    background-color: ${({ theme }) => theme.fill30};
  }
`;

const Profile = () => {
  const { activeAccount, isAutoConnectDone } = useConnectToStoredAccount();
  const { api, isAccountActionsVisible, onWalletDisconnect, setIsAccountActionsVisible } = useAccounts();
  const { nativeBalance, getNativeBalance } = useNativeBalance();
  const dropdownRef = useOutsideClick(() => setIsAccountActionsVisible(false));
  const [copyToClipboard, buttonText] = useCopyToClipboard(activeAccount?.address || '', '', 'copied', 350);

  useEffect(() => {
    const connect = document.getElementById('connect');

    if (connect !== null) {
      if (isAccountActionsVisible) {
        connect.classList.add('actions-active');
      } else {
        connect.classList.remove('actions-active');
      }
    }
  }, [isAccountActionsVisible]);

  const handleShow = () => {
    setIsAccountActionsVisible(!isAccountActionsVisible);
    getNativeBalance();
  };

  if (!isAutoConnectDone || !activeAccount) {
    return null;
  }

  return (
    <>
      <SContainer ref={dropdownRef}>
        <SConnectButton id='connect' className='active' onClick={handleShow}>
          <Identicon data={activeAccount.address} />
          <span>{truncate(activeAccount.name, { length: 16 }) || ellipseAddress(activeAccount.address)}</span>
        </SConnectButton>

        <SAccountActions className={isAccountActionsVisible ? 'active' : ''}>
          <STopInfo>
            <div className='regular'>Your Balance</div>
            <div className='highlighted'>
              {nativeBalance &&
                api &&
                formatBalance(nativeBalance, {
                  decimals: api.registry.chainDecimals[0],
                  withUnit: api.registry.chainTokens[0],
                  forceUnit: '-',
                })}
            </div>

            <SSeparator />
          </STopInfo>

          <SActionBlock onClick={() => setIsAccountActionsVisible(false)}>
            <SSimpleAction onClick={copyToClipboard}>
              <span>Copy Wallet Address</span>
              <SIcon className={buttonText || ''}>
                <CopyIcon />
              </SIcon>
            </SSimpleAction>

            <SSimpleAction onClick={onWalletDisconnect}>
              <span>Disconnect wallet</span>
              <SIcon>
                <ExitIcon />
              </SIcon>
            </SSimpleAction>
          </SActionBlock>
        </SAccountActions>
      </SContainer>
    </>
  );
};

export default memo(Profile);
