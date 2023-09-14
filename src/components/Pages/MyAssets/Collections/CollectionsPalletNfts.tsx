import { memo, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

import ModalStatus from '@common/ModalStatus.tsx';
import Title from '@common/Title.tsx';

import { CssFontRegularM, CssFontRegularS, SContentBlockContainer } from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';

import { useLoadOwnedNftsCollections } from '@hooks/useLoadCollectionsData.ts';

import EditTeamModal from '@modals/EditTeamModal/EditTeamModal.tsx';

import CollectionPalletNfts from './CollectionPalletNfts.tsx';

const SubTitle = styled.div`
  margin-bottom: 30px;
`;

const RulesBlock = styled(Card)`
  margin-bottom: 30px;
  padding: 18px 24px;
  display: block;
  ${CssFontRegularS}
`;

const RuleTitle = styled.div`
  ${CssFontRegularM};
  color: ${({ theme }) => theme.textAndIconsSecondary};
`;

const RuleSteps = styled.div`
  padding-left: 10px;
  ${CssFontRegularS};
  color: ${({ theme }) => theme.textAndIconsSecondary};
`;

const STable = styled.table`
  width: 100%;
  td {
    padding: 10px;
  }
`;

const PalletSelector = styled.div`
  float: right;
  a {
    ${CssFontRegularS}
  }
`;

const CollectionsPalletNfts = () => {
  const [isEditTeamModalVisible, setIsEditTeamModalVisible] = useState(false);
  const [editTeamCollectionId, setEditTeamCollectionId] = useState<string>();
  const collections = useLoadOwnedNftsCollections();

  const handleEditTeamModalClose = () => setIsEditTeamModalVisible(false);
  const handleShowEditTeamModal = (collectionId: string) => {
    setEditTeamCollectionId(collectionId);
    setIsEditTeamModalVisible(true);
  };

  return (
    <>
      {isEditTeamModalVisible && editTeamCollectionId && (
        <EditTeamModal onFormClose={handleEditTeamModalClose} collectionId={editTeamCollectionId} />
      )}
      <ModalStatus />
      <Title className='main no-margin'>
        <>
          <PalletSelector>
            <Link to={routes.myCollections.palletUniques}>Switch to pallet-uniques</Link>
          </PalletSelector>
          My Collections
        </>
      </Title>
      <SubTitle>*pallet nfts</SubTitle>
      <RulesBlock>
        <RuleTitle>Migration rules:</RuleTitle>
        <RuleSteps>
          1) a collection is considered mapped when there is a similar collection created in another pallet that has the
          same metadata and the same owner;
          <br />
          2) the data snapshot needs to be attached to the source collection`s attributes;
          <br />
          3) if the source collection in the pallet-uniques is locked, then the snapshot can be attached to the cloned
          collection.
        </RuleSteps>
      </RulesBlock>

      {collections === null && <>Gathering data... please wait</>}

      {Array.isArray(collections) && collections.length > 0 && (
        <SContentBlockContainer>
          <STable>
            <tbody>
              {collections.map((collection) => (
                <CollectionPalletNfts
                  key={collection.id}
                  collection={collection}
                  onChangeTeam={() => handleShowEditTeamModal(collection.id)}
                />
              ))}
            </tbody>
          </STable>
        </SContentBlockContainer>
      )}

      {Array.isArray(collections) && collections.length === 0 && <>No collections found</>}
    </>
  );
};

export default memo(CollectionsPalletNfts);
