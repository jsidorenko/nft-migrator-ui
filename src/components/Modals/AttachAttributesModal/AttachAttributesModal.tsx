import { FormEvent, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { FormControl, Modal, Stack } from 'react-bootstrap';
import { styled } from 'styled-components';

import ActionButton from '@buttons/ActionButton.tsx';

import { NFT_PALLETS, SUPPORTED_ATTRIBUTE_KEYS } from '@helpers/config.ts';
import { CollectionSnapshot } from '@helpers/interfaces.js';
import { CssFontRegularS, SFormBlock, SPageControls } from '@helpers/reusableStyles.ts';
import { SFormLayout, SGroup, SLabel, SModal, SNote } from '@helpers/styledComponents.ts';

import { useCollections } from '@hooks/useCollections.ts';

interface ConnectModalProps {
  collectionId: string;
  pallet: NFT_PALLETS;
  attributesAreLocked: boolean;
  onFormClose: () => void;
}

const SDescription = styled.p`
  ${CssFontRegularS};
  margin: -15px 0 0;
  color: ${({ theme }) => theme.textAndIconsTertiary};
`;

const AttachAttributesModal = ({ onFormClose, collectionId, pallet, attributesAreLocked }: ConnectModalProps) => {
  const {
    getCollectionAttributes,
    getCollectionRoles,
    collectionNftsAttributes,
    collectionUniquesAttributes,
    collectionNftsRoles,
    collectionUniquesRoles,
    attachSnapshot,
  } = useCollections();
  const linkRef = useRef<HTMLInputElement>(null);
  const providerRef = useRef<HTMLInputElement>(null);

  const attributes = useMemo(() => {
    const values = pallet === 'nfts' ? collectionNftsAttributes : collectionUniquesAttributes;
    let snapshotLink;
    let snapshotProvider;
    if (values) {
      snapshotLink = values.find((item) => item.key === SUPPORTED_ATTRIBUTE_KEYS.SNAPSHOT)?.value;
      snapshotProvider = values.find((item) => item.key === SUPPORTED_ATTRIBUTE_KEYS.PROVIDER)?.value;
    }
    return {
      values,
      snapshotLink,
      snapshotProvider,
    };
  }, [collectionNftsAttributes, collectionUniquesAttributes, pallet]);

  const collectionRoles = useMemo(
    () => (pallet === 'nfts' ? collectionNftsRoles : collectionUniquesRoles),
    [collectionNftsRoles, collectionUniquesRoles, pallet],
  );

  const saveForm = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (linkRef.current !== null && providerRef.current !== null && collectionRoles !== null) {
        const newValues: CollectionSnapshot = {
          link: linkRef.current.value,
          provider: providerRef.current.value,
        };

        const oldValues: CollectionSnapshot = {
          link: attributes.snapshotLink,
          provider: attributes.snapshotProvider,
        };

        onFormClose();
        attachSnapshot(pallet, collectionId, newValues, oldValues, collectionRoles);
      }
    },
    [
      attributes.snapshotLink,
      attributes.snapshotProvider,
      onFormClose,
      attachSnapshot,
      pallet,
      collectionId,
      collectionRoles,
    ],
  );

  useEffect(() => {
    getCollectionRoles(collectionId, pallet);
    getCollectionAttributes(collectionId, pallet);
  }, [collectionId, pallet, getCollectionAttributes, getCollectionRoles]);

  const formIsDisabled = useMemo(
    () => attributesAreLocked || (pallet === 'nfts' && !collectionRoles?.admin),
    [attributesAreLocked, collectionRoles?.admin, pallet],
  );

  return (
    <SModal centered show={true} onHide={onFormClose}>
      <Modal.Header className='border-0'>Attach snapshot</Modal.Header>
      <Modal.Body>
        {(attributes.values === null || collectionRoles === null) && <>Loading data...</>}
        {attributes.values !== null && collectionRoles !== null && (
          <SFormLayout onSubmit={saveForm}>
            <section>
              {pallet === 'nfts' && !collectionRoles?.admin && (
                <SNote>
                  <b>Important!</b> The Admin role is disabled in this collections, so the attributes change is not
                  possible.
                </SNote>
              )}

              <SFormBlock>
                <SGroup className='text-left'>
                  <SLabel>IPFS Link</SLabel>
                  <FormControl
                    type='text'
                    ref={linkRef}
                    defaultValue={attributes.snapshotLink}
                    disabled={formIsDisabled}
                  />
                </SGroup>
                <SDescription>e.g. ipfs://ipfs/abcd</SDescription>
              </SFormBlock>

              <SFormBlock>
                <SGroup>
                  <SLabel>IPFS provider (optional)</SLabel>
                  <FormControl
                    type='text'
                    ref={providerRef}
                    defaultValue={attributes.snapshotProvider}
                    disabled={formIsDisabled}
                  />
                </SGroup>
                <SDescription>e.g. https://ipfs.filebase.io/ipfs/</SDescription>
              </SFormBlock>

              <SPageControls className='pb-0 pt-0'>
                <Stack direction='horizontal' gap={3}>
                  <ActionButton type='button' className='stroke w-100' action={onFormClose}>
                    Back
                  </ActionButton>
                  <ActionButton type='submit' className='main w-75' disabled={formIsDisabled}>
                    Save
                  </ActionButton>
                </Stack>
              </SPageControls>
            </section>
          </SFormLayout>
        )}
      </Modal.Body>
    </SModal>
  );
};

export default memo(AttachAttributesModal);
