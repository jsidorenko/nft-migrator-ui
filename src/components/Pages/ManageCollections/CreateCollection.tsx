import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormControl, Stack } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { styled } from 'styled-components';

import ActionButton from '@buttons/ActionButton.tsx';

import Checkbox from '@common/Checkbox.tsx';
import ModalStatus from '@common/ModalStatus.tsx';
import Title from '@common/Title.tsx';

import { useAccounts } from '@contexts/AccountsContext.tsx';

import { MintTypes } from '@helpers/config.ts';
import { CollectionConfig } from '@helpers/interfaces.ts';
import { CssFontRegularS, SFormBlock, SPageControls } from '@helpers/reusableStyles.ts';
import { routes } from '@helpers/routes.ts';
import { SFormLayout, SGroup, SLabel } from '@helpers/styledComponents.ts';
import { BitFlags, wholeNumbersPattern } from '@helpers/utilities.ts';

import { useCollections } from '@hooks/useCollections.ts';

const SDescription = styled.p`
  margin: 12px 0 24px;
  color: ${({ theme }) => theme.textAndIconsTertiary};

  :last-child {
    margin-bottom: 0;
  }

  &.margin-left {
    margin-left: 4px;
  }

  &.note {
    ${CssFontRegularS};
    background-color: rgb(255, 248, 197);
    padding: 10px 15px;
    color: ${({ theme }) => theme.textAndIconsSecondary};
  }
`;

const CreateCollection = () => {
  const { collectionId } = useParams();
  const { api, activeAccount } = useAccounts();
  const {
    validateOwnedCollection,
    getCollectionMetadata,
    createCollection,
    collectionUniquesMetadata,
    isCollectionMetadataLoading,
  } = useCollections();

  const collectionAdminRef = useRef<HTMLInputElement>(null);
  const transferableItemsRef = useRef<HTMLInputElement | null>(null);
  const unlockedMetadataRef = useRef<HTMLInputElement | null>(null);
  const unlockedAttributesRef = useRef<HTMLInputElement | null>(null);
  const unlockedMaxSupplyRef = useRef<HTMLInputElement | null>(null);
  const maxSupplyRef = useRef<HTMLInputElement | null>(null);

  const [collectionExists, setCollectionExists] = useState<boolean>();

  const submitCreateCollection = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (
        api !== null &&
        collectionUniquesMetadata !== null &&
        collectionAdminRef.current !== null &&
        transferableItemsRef.current !== null &&
        unlockedMetadataRef.current !== null &&
        unlockedAttributesRef.current !== null &&
        unlockedMaxSupplyRef.current !== null &&
        maxSupplyRef.current !== null
      ) {
        const settingsBefore = BitFlags.toBitFlag(
          [
            transferableItemsRef.current.checked,
            true,
            // unlockedMetadataRef.current.checked,
            unlockedAttributesRef.current.checked,
            unlockedMaxSupplyRef.current.checked,
          ],
          true,
        );

        const settingsAfter = !unlockedMetadataRef.current.checked
          ? BitFlags.toBitFlag(
              [
                transferableItemsRef.current.checked,
                unlockedMetadataRef.current.checked,
                unlockedAttributesRef.current.checked,
                unlockedMaxSupplyRef.current.checked,
              ],
              true,
            )
          : null;

        const collectionConfig: CollectionConfig = {
          settings: settingsBefore,
          maxSupply: maxSupplyRef.current.value === '' ? undefined : parseInt(maxSupplyRef.current.value, 10),
          mintSettings: {
            mintType: MintTypes.ISSUER,
            defaultItemSettings: 0,
          },
        };

        createCollection(
          collectionConfig,
          collectionUniquesMetadata.metadataLink,
          collectionAdminRef.current.value,
          settingsAfter,
        );
      }
    },
    [api, createCollection, collectionUniquesMetadata],
  );

  useEffect(() => {
    if (collectionId && collectionExists) {
      getCollectionMetadata(collectionId, 'uniques');
    }
  }, [collectionId, getCollectionMetadata, collectionExists]);

  useEffect(() => {
    if (collectionId) {
      validateOwnedCollection(collectionId, 'uniques').then(setCollectionExists);
    }
  }, [collectionId, validateOwnedCollection]);

  const metadataPreview = useMemo(
    () => (collectionUniquesMetadata?.json ? JSON.stringify(collectionUniquesMetadata?.json) : ''),
    [collectionUniquesMetadata?.json],
  );

  if (collectionExists === false) {
    return <>Collection not found</>;
  }

  if (isCollectionMetadataLoading) {
    return <>Gathering data... please wait</>;
  }

  return (
    <>
      <Title className='main'>
        <Link to={routes.myCollections.palletUniques}>Clone Collection</Link>
      </Title>
      <ModalStatus />

      <SFormLayout onSubmit={submitCreateCollection}>
        <section>
          <SFormBlock>
            <SGroup>
              <SLabel>Collection metadata</SLabel>
              {!collectionUniquesMetadata?.metadataLink && <SDescription>The metadata is empty</SDescription>}
              {metadataPreview && <FormControl type='text' disabled value={collectionUniquesMetadata?.metadataLink} />}
            </SGroup>
          </SFormBlock>

          {collectionUniquesMetadata?.metadataLink && (
            <SFormBlock>
              <SGroup>
                <SLabel>Metadata preview</SLabel>
                <FormControl as='textarea' disabled value={metadataPreview} />
              </SGroup>
            </SFormBlock>
          )}

          <SFormBlock>
            <SGroup>
              <SLabel>Admin</SLabel>
              <FormControl
                type='text'
                defaultValue={activeAccount?.address}
                placeholder='Admin account address'
                ref={collectionAdminRef}
              />
            </SGroup>
          </SFormBlock>

          <SFormBlock>
            <SLabel className='group-title'>Collection settings</SLabel>
            <SGroup className='m-3'>
              <Checkbox ref={transferableItemsRef} label='Transferable items' defaultChecked />
              <SDescription>When disabled, the items will be non-transferable (good for soul-bound NFTs)</SDescription>

              <Checkbox ref={unlockedMetadataRef} label='Unlocked metadata' defaultChecked />
              <SDescription>When disabled, the collection metadata will be locked</SDescription>

              <Checkbox ref={unlockedAttributesRef} label='Unlocked attributes' defaultChecked />
              <SDescription>When disabled, the attributes in the CollectionOwner namespace will be locked</SDescription>
              {collectionUniquesMetadata?.attributesAreLocked && (
                <SDescription className='note'>
                  Warning: Source collection`s attributes are locked, if you lock the attributes in this collection as
                  well (by unchecking the checkbox above), you won`t be able to attach the required data snapshot after.
                </SDescription>
              )}

              <Checkbox ref={unlockedMaxSupplyRef} label='Editable max supply' defaultChecked />
              <SDescription>
                allows to change the max supply until it gets locked (i.e. the possibility to change the supply for a
                limited amount of time)
              </SDescription>
            </SGroup>
          </SFormBlock>

          <SFormBlock>
            <SGroup>
              <SLabel>
                Max supply (<i>optional</i>)
              </SLabel>
              <FormControl
                type='number'
                ref={maxSupplyRef}
                min={0}
                pattern={wholeNumbersPattern}
                placeholder='Set amount'
              />
              <SDescription className='margin-left'>leave empty to have unlimited supply</SDescription>
            </SGroup>
          </SFormBlock>

          <SPageControls>
            <Stack direction='horizontal' gap={3}>
              <Link to={routes.myCollections.palletUniques} className='w-25'>
                <ActionButton type='button' className='stroke w-100'>
                  Back
                </ActionButton>
              </Link>
              <ActionButton type='submit' className='main w-75'>
                Create collection
              </ActionButton>
            </Stack>
          </SPageControls>
        </section>
      </SFormLayout>
    </>
  );
};

export default memo(CreateCollection);
