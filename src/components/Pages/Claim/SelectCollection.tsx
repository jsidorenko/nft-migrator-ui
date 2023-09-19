import { truncate } from 'lodash';
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

import ActionButton from '@buttons/ActionButton.tsx';
import IconArrowButton from '@buttons/IconArrowButton.tsx';

import Title from '@common/Title.tsx';

import { CssFontRegularM, CssFontSemiBoldL } from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';

import { useLoadMappedCollections } from '@hooks/useLoadCollectionsData.ts';

import CollectionIcon from '@images/icons/collection.svg';

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

const SChoose = styled.div`
  ${CssFontRegularM};
  margin: 0 0 24px;
  color: ${({ theme }) => theme.textAndIconsPrimary};
`;

const SCollectionOption = styled(Link)`
  display: block;
  text-decoration: none;

  & + a {
    margin-top: 8px;
  }
`;

const SelectCollection = () => {
  const collections = useLoadMappedCollections();

  if (collections === null) {
    return <>Gathering data... please wait</>;
  }

  if (Array.isArray(collections) && collections.length === 0) {
    return (
      <SContainer>
        <SHugeIcon>
          <CollectionIcon />
        </SHugeIcon>
        <SNote>There are no collections prepared for the migration yet :(</SNote>
        <Link to='..'>
          <ActionButton className='main-king w-100'>Go back</ActionButton>
        </Link>
      </SContainer>
    );
  }

  return (
    <>
      <Title className='main no-margin'>Migrate your NFTs</Title>
      <SContainer>
        <SChoose>Select a collection</SChoose>
        {collections.map((collection) => (
          <SCollectionOption
            to={routes.claim.claimNft(collection.sourceCollection, collection.targetCollection)}
            key={collection.sourceCollection}
          >
            <IconArrowButton imageCid={collection.json?.image}>
              {truncate(collection.json?.name || ' - no title - ', { length: 20 })}
            </IconArrowButton>
          </SCollectionOption>
        ))}
      </SContainer>
    </>
  );
};

export default memo(SelectCollection);
