'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import {
  ConfirmationModal,
  FormModal,
  ViewModal,
} from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import {
  useDeleteEntity,
  useGetEntityList,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  ICharacterListFilters,
  ICharacterListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedCharacterStore } from '@/store';
import { CharactersList } from './components/CharactersList';
import { CharacterCreateForm } from './components/CharacterCreateForm';
import { CharactersFilterSection } from './components/CharactersFilterSection';
import { CharacterView } from './components/CharacterView';

export default function CharactersPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [characterPendingDelete, setCharacterPendingDelete] =
    useState<ICharacterListItem | null>(null);
  const [characterPendingView, setCharacterPendingView] =
    useState<ICharacterListItem | null>(null);
  const [filters, setFilters] = useState<ICharacterListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedCharacter, resetSelectedCharacter, setSelectedCharacter } =
    useSelectedCharacterStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    ICharacterListItem,
    ICharacterListFilters
  >({
    url: '/characters',
    filters,
  });

  const deleteCharacterMutation = useDeleteEntity({
    url: `/characters/${characterPendingDelete?.id}`,
    invalidateQueryKeys: [['/characters']],
    onSuccess: () => {
      showToast({
        message: 'Personagem excluído com sucesso.',
        type: 'success',
      });
      setCharacterPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o personagem.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      tagIds: selectedTags.length
        ? selectedTags.map((tag) => tag.id)
        : undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setSelectedTags([]);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedCharacter();
    setIsFormModalOpen(true);
  };

  const handleEdit = (character: ICharacterListItem) => {
    setSelectedCharacter(character);
    setIsFormModalOpen(true);
  };

  const handleView = (character: ICharacterListItem) => {
    setCharacterPendingView(character);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedCharacter();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Personagens
        </Title>
        {!isGoogleUser && (
          <PrimaryButton
            type="button"
            onClick={handleOpenCreateModal}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Novo
          </PrimaryButton>
        )}
      </div>

      <CharactersFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <CharactersList
        characters={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setCharacterPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedCharacter ? 'Editar personagem' : 'Nova personagem'}
        size="wide"
      >
        <CharacterCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!characterPendingView}
        onClose={() => setCharacterPendingView(null)}
        title="Detalhes do Personagem"
        size="wide"
      >
        {characterPendingView && (
          <CharacterView characterId={characterPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!characterPendingDelete}
        title="Excluir personagem"
        message={`Tem certeza que deseja excluir o personagem "${characterPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteCharacterMutation.isPending}
        onConfirm={() => deleteCharacterMutation.mutate()}
        onCancel={() => setCharacterPendingDelete(null)}
      />
    </PageContainer>
  );
}
