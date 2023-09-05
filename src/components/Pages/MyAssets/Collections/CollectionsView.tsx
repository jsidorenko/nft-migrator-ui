import { memo } from 'react';
import { Card } from 'react-bootstrap';
import { styled } from 'styled-components';

import Title from '@common/Title.tsx';

import { CssFontRegularM, CssFontRegularS, SContentBlockContainer } from '@helpers/reusableStyles.ts';

import { useLoadOwnedCollections } from '@hooks/useLoadCollectionsData.ts';

import CollectionRow from './CollectionRow.tsx';

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
  ${CssFontRegularM}
  color: ${({ theme }) => theme.textAndIconsSecondary};
`;

const RuleSteps = styled.div`
  padding-left: 10px;
  ${CssFontRegularS}
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

const CollectionsView = () => {
  const collections = useLoadOwnedCollections();

  if (collections === null) {
    return <>Gathering data... please wait</>;
  }

  if (Array.isArray(collections) && collections.length === 0) {
    return <>No collections found</>;
  }

  return (
    <>
      <Title className='main no-margin'>
        <>
          <PalletSelector>
            <a href='#' className='not-selected'>
              Switch to pallet-nfts
            </a>
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
      <SContentBlockContainer>
        <STable>
          <tbody>
            {collections.map((collection) => (
              <CollectionRow key={collection.id} collection={collection} />
            ))}
          </tbody>
        </STable>
      </SContentBlockContainer>
    </>
  );
};

export default memo(CollectionsView);
