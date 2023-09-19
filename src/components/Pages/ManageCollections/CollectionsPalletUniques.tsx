import { memo, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

import ModalStatus from '@common/ModalStatus.tsx';
import Title from '@common/Title.tsx';

import type { AttachAttributesModalData } from '@helpers/interfaces.ts';
import { CssFontRegularM, CssFontRegularS, SContentBlockContainer } from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';

import { useLoadOwnedUniquesCollections } from '@hooks/useLoadCollectionsData.ts';

import AttachAttributesModal from '@modals/AttachAttributesModal/AttachAttributesModal.tsx';

import CollectionPalletUniques from './CollectionPalletUniques.tsx';

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

const CollectionsPalletUniques = () => {
  const [isAttachAttributesModalVisible, setIsAttachAttributesModalVisible] = useState(false);
  const [attachAttributesModalData, setAttachAttributesModalData] = useState<AttachAttributesModalData>();
  const collections = useLoadOwnedUniquesCollections();

  const handleAttachAttributesModalClose = () => setIsAttachAttributesModalVisible(false);
  const handleAttachAttributesModal = (collectionId: string, attributesAreLocked: boolean) => {
    setAttachAttributesModalData({ collectionId, attributesAreLocked });
    setIsAttachAttributesModalVisible(true);
  };
  return (
    <>
      {isAttachAttributesModalVisible && attachAttributesModalData && (
        <AttachAttributesModal
          onFormClose={handleAttachAttributesModalClose}
          collectionId={attachAttributesModalData.collectionId}
          attributesAreLocked={attachAttributesModalData.attributesAreLocked}
          pallet='uniques'
        />
      )}
      <ModalStatus />
      <Title className='main no-margin'>
        <>
          <PalletSelector>
            <Link to={routes.myCollections.palletNfts}>Switch to pallet-nfts</Link>
          </PalletSelector>
          My Collections
        </>
      </Title>
      <SubTitle>*pallet uniques</SubTitle>
      <RulesBlock>
        <RuleTitle>To migrate nfts to the new pallet:</RuleTitle>
        <RuleSteps>
          1) a new collection with exactly the same metadata in the pallet-nfts needs to be created;
          <br />
          2) use{' '}
          <a href='https://github.com/jsidorenko/nft-migrator/' target='_blank' rel='noreferrer'>
            nft-migrator
          </a>{' '}
          scripts to take a data snapshot and sign it with the admin`s account;
          <br />
          3) upload the generated JSON file to IPFS and store its hash inside the collection`s attributes.
        </RuleSteps>
      </RulesBlock>

      {collections === null && <>Gathering data... please wait</>}

      {Array.isArray(collections) && collections.length > 0 && (
        <SContentBlockContainer>
          <STable>
            <tbody>
              {collections.map((collection) => (
                <CollectionPalletUniques
                  key={collection.id}
                  collection={collection}
                  onAttachAttributes={() => handleAttachAttributesModal(collection.id, collection.attributesAreLocked)}
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

export default memo(CollectionsPalletUniques);
