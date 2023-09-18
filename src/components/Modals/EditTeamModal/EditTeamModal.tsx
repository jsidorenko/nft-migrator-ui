import { FormEvent, memo, useCallback, useEffect, useRef } from 'react';
import { FormControl, Modal, Stack } from 'react-bootstrap';

import ActionButton from '@buttons/ActionButton.tsx';

import { CollectionRoles } from '@helpers/interfaces.ts';
import { SFormBlock, SPageControls } from '@helpers/reusableStyles.ts';
import { SFormLayout, SGroup, SLabel, SModal, SNote } from '@helpers/styledComponents.ts';

import { useCollections } from '@hooks/useCollections.ts';

interface ConnectModalProps {
  collectionId: string;
  onFormClose: () => void;
}

const EditTeamModal = ({ onFormClose, collectionId }: ConnectModalProps) => {
  const { getCollectionRoles, collectionNftsRoles, updateTeam } = useCollections();
  const adminRef = useRef<HTMLInputElement>(null);
  const issuerRef = useRef<HTMLInputElement>(null);
  const freezerRef = useRef<HTMLInputElement>(null);

  const saveForm = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (adminRef.current !== null && issuerRef.current !== null && freezerRef.current !== null) {
        const team: CollectionRoles = {
          admin: adminRef.current.value,
          issuer: issuerRef.current.value,
          freezer: freezerRef.current.value,
        };

        onFormClose();
        updateTeam('nfts', collectionId, team);
      }
    },
    [collectionId, onFormClose, updateTeam],
  );

  useEffect(() => {
    getCollectionRoles(collectionId, 'nfts');
  }, [collectionId, getCollectionRoles]);

  return (
    <SModal centered show={true} onHide={onFormClose}>
      <Modal.Header className='border-0'>Edit team for collection #{collectionId}</Modal.Header>
      <Modal.Body>
        {collectionNftsRoles === null && <>Loading data...</>}
        {collectionNftsRoles !== null && (
          <SFormLayout onSubmit={saveForm}>
            <section>
              <SFormBlock>
                <SGroup className='text-left'>
                  <SLabel>Admin</SLabel>
                  <FormControl
                    type='text'
                    ref={adminRef}
                    defaultValue={collectionNftsRoles.admin}
                    placeholder={!collectionNftsRoles.admin ? 'role disabled' : 'Admin`s account address'}
                    disabled={!collectionNftsRoles.admin}
                  />
                </SGroup>
              </SFormBlock>

              <SFormBlock>
                <SGroup>
                  <SLabel>Issuer</SLabel>
                  <FormControl
                    type='text'
                    ref={issuerRef}
                    defaultValue={collectionNftsRoles.issuer}
                    placeholder={!collectionNftsRoles.issuer ? 'role disabled' : 'Issuer`s account address'}
                    disabled={!collectionNftsRoles.issuer}
                  />
                </SGroup>
              </SFormBlock>

              <SFormBlock>
                <SGroup>
                  <SLabel>Freezer</SLabel>
                  <FormControl
                    type='text'
                    ref={freezerRef}
                    defaultValue={collectionNftsRoles.freezer}
                    placeholder={!collectionNftsRoles.freezer ? 'role disabled' : 'Freezer`s account address'}
                    disabled={!collectionNftsRoles.freezer}
                  />
                </SGroup>
              </SFormBlock>

              <SNote>
                Note: You can disable any role by setting an empty value instead of the address, but this action is
                irreversible.
              </SNote>

              <SPageControls className='pb-0 pt-0'>
                <Stack direction='horizontal' gap={3}>
                  <ActionButton type='button' className='stroke w-100' action={onFormClose}>
                    Back
                  </ActionButton>
                  <ActionButton type='submit' className='main w-75'>
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

export default memo(EditTeamModal);
