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
  IAmmunitionListFilters,
  IAmmunitionListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedAmmunitionStore } from '@/store';
import { AmmunitionList } from './components/AmmunitionList';
import { AmmunitionCreateForm } from './components/AmmunitionCreateForm';
import { AmmunitionFilterSection } from './components/AmmunitionFilterSection';
import { AmmunitionView } from './components/AmmunitionView';

export default function AmmunitionPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [ammunitionPendingDelete, setAmmunitionPendingDelete] =
    useState<IAmmunitionListItem | null>(null);
  const [ammunitionPendingView, setAmmunitionPendingView] =
    useState<IAmmunitionListItem | null>(null);
  const [filters, setFilters] = useState<IAmmunitionListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const {
    selectedAmmunition,
    resetSelectedAmmunition,
    setSelectedAmmunition,
  } = useSelectedAmmunitionStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    IAmmunitionListItem,
    IAmmunitionListFilters
  >({
    url: '/ammunition',
    filters,
  });

  const deleteAmmunitionMutation = useDeleteEntity({
    url: `/ammunition/${ammunitionPendingDelete?.id}`,
    invalidateQueryKeys: [['/ammunition']],
    onSuccess: () => {
      showToast({
        message: 'Munição excluída com sucesso.',
        type: 'success',
      });
      setAmmunitionPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a munição.',
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
    resetSelectedAmmunition();
    setIsFormModalOpen(true);
  };

  const handleEdit = (ammunition: IAmmunitionListItem) => {
    setSelectedAmmunition(ammunition);
    setIsFormModalOpen(true);
  };

  const handleView = (ammunition: IAmmunitionListItem) => {
    setAmmunitionPendingView(ammunition);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedAmmunition();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Munições
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

      <AmmunitionFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <AmmunitionList
        ammunition={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setAmmunitionPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedAmmunition ? 'Editar munição' : 'Nova munição'}
        size="wide"
      >
        <AmmunitionCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!ammunitionPendingView}
        onClose={() => setAmmunitionPendingView(null)}
        title="Detalhes da Munição"
        size="wide"
      >
        {ammunitionPendingView && (
          <AmmunitionView ammunitionId={ammunitionPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!ammunitionPendingDelete}
        title="Excluir munição"
        message={`Tem certeza que deseja excluir a munição "${ammunitionPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteAmmunitionMutation.isPending}
        onConfirm={() => deleteAmmunitionMutation.mutate()}
        onCancel={() => setAmmunitionPendingDelete(null)}
      />
    </PageContainer>
  );
}
