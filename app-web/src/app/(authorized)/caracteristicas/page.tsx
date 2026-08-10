'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal, ViewModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import {
  useDeleteEntity,
  useGetEntityList,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  ICharacteristicListFilters,
  ICharacteristicListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedCharacteristicStore } from '@/store';
import { CharacteristicsList } from './components/CharacteristicsList';
import { CharacteristicCreateForm } from './components/CharacteristicCreateForm';
import { CharacteristicsFilterSection } from './components/CharacteristicsFilterSection';
import { CharacteristicView } from './components/CharacteristicView';

export default function CharacteristicsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [characteristicPendingDelete, setCharacteristicPendingDelete] =
    useState<ICharacteristicListItem | null>(null);
  const [characteristicPendingView, setCharacteristicPendingView] =
    useState<ICharacteristicListItem | null>(null);
  const [filters, setFilters] = useState<ICharacteristicListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const {
    selectedCharacteristic,
    resetSelectedCharacteristic,
    setSelectedCharacteristic,
  } = useSelectedCharacteristicStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    ICharacteristicListItem,
    ICharacteristicListFilters
  >({
    url: '/characteristics',
    filters,
  });

  const deleteCharacteristicMutation = useDeleteEntity({
    url: `/characteristics/${characteristicPendingDelete?.id}`,
    invalidateQueryKeys: [['/characteristics']],
    onSuccess: () => {
      showToast({
        message: 'Característica excluída com sucesso.',
        type: 'success',
      });
      setCharacteristicPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a característica.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedLevel = Number(levelInput.trim());
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      level:
        levelInput.trim() && !Number.isNaN(parsedLevel)
          ? parsedLevel
          : undefined,
      tagIds: selectedTags.length
        ? selectedTags.map((tag) => tag.id)
        : undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setLevelInput('');
    setSelectedTags([]);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedCharacteristic();
    setIsFormModalOpen(true);
  };

  const handleEdit = (characteristic: ICharacteristicListItem) => {
    setSelectedCharacteristic(characteristic);
    setIsFormModalOpen(true);
  };

  const handleView = (characteristic: ICharacteristicListItem) => {
    setCharacteristicPendingView(characteristic);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedCharacteristic();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Características
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

      <CharacteristicsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        levelValue={levelInput}
        onLevelChange={setLevelInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <CharacteristicsList
        characteristics={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setCharacteristicPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={
          selectedCharacteristic ? 'Editar característica' : 'Nova característica'
        }
        size="wide"
      >
        <CharacteristicCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!characteristicPendingView}
        onClose={() => setCharacteristicPendingView(null)}
        title="Detalhes da Característica"
        size="wide"
      >
        {characteristicPendingView && (
          <CharacteristicView
            characteristicId={characteristicPendingView.id}
          />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!characteristicPendingDelete}
        title="Excluir característica"
        message={`Tem certeza que deseja excluir a característica "${characteristicPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteCharacteristicMutation.isPending}
        onConfirm={() => deleteCharacteristicMutation.mutate()}
        onCancel={() => setCharacteristicPendingDelete(null)}
      />
    </PageContainer>
  );
}
