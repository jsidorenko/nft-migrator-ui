import { memo, useCallback, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { styled } from 'styled-components';

import ActionButton from '@buttons/ActionButton.tsx';

import ModalStatus from '@common/ModalStatus.tsx';

import { CssFontSemiBoldL, SContentBlockContainer } from '@helpers/reusableStyles.ts';

import { useCollections } from '@hooks/useCollections.ts';
import { useLoadMappedCollections } from '@hooks/useLoadCollectionsData.ts';

import CollectionIcon from '@images/icons/collection.svg';

import ClaimableNft from './ClaimableNft.tsx';

const SContainer = styled.div`
  max-width: 458px;
  padding: 32px;
  text-align: center;
  margin: 50px auto 0;
  border: 1px solid ${({ theme }) => theme.appliedStroke};
  border-radius: 24px;
`;

const SHugeIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 136px;
  height: 136px;
  margin: 12px auto 32px;
  background-color: ${({ theme }) => theme.fill6};
  border-radius: 104px;

  svg {
    width: 72px;
    height: 72px;
  }
`;

const SNote = styled.div`
  ${CssFontSemiBoldL};
  margin-bottom: 32px;
`;

const STable = styled.table`
  width: 100%;
  td {
    padding: 10px;
  }
`;

const ClaimNft = () => {
  const { sourceCollectionId, targetCollectionId } = useParams();
  const supportedCollections = useLoadMappedCollections();
  const { loadMigrationData, migrationData, migrationDataStatus, claimNft } = useCollections();

  const paramsCorrect = useMemo(() => {
    if (!sourceCollectionId || !targetCollectionId) return false;
    if (supportedCollections === null) return null;
    return supportedCollections.some(
      (collection) =>
        collection.sourceCollection === sourceCollectionId && collection.targetCollection === targetCollectionId,
    );
  }, [sourceCollectionId, targetCollectionId, supportedCollections]);

  const handleClaimAction = useCallback(
    async (itemId: string) => {
      if (migrationData) {
        const item = migrationData.find((data) => data.preSignInfo.item.toString() === itemId);
        if (item) {
          claimNft(item);
        }
      }
    },
    [claimNft, migrationData],
  );

  useEffect(() => {
    if (sourceCollectionId && targetCollectionId) {
      loadMigrationData(sourceCollectionId, targetCollectionId);
    }
  }, [sourceCollectionId, targetCollectionId, loadMigrationData]);

  if (paramsCorrect === false) {
    return <>The provided collection ids are incorrect</>;
  }

  if (migrationDataStatus !== '') {
    return <>{migrationDataStatus}</>;
  }

  if (paramsCorrect === null || migrationData === null) {
    return <>Loading data...</>;
  }

  if (Array.isArray(migrationData) && migrationData.length === 0) {
    return (
      <SContainer>
        <SHugeIcon>
          <CollectionIcon />
        </SHugeIcon>
        <SNote>No NFTs for your account found to claim :(</SNote>
        <Link to='..'>
          <ActionButton className='main-king w-100'>Go back</ActionButton>
        </Link>
      </SContainer>
    );
  }

  return (
    <>
      <ModalStatus />
      {Array.isArray(migrationData) && migrationData.length > 0 && (
        <SContentBlockContainer>
          <STable>
            <tbody>
              {migrationData.map((data) => (
                <ClaimableNft
                  data={data}
                  key={data.preSignInfo.item.toString()}
                  onClaim={() => handleClaimAction(data.preSignInfo.item.toString())}
                />
              ))}
            </tbody>
          </STable>
        </SContentBlockContainer>
      )}
    </>
  );
};

export default memo(ClaimNft);
