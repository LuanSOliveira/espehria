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
  IBiographyListFilters,
  IBiographyListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedBiographyStore } from '@/store';
import { BiographiesList } from './components/BiographiesList';
import { BiographyCreateForm } from './components/BiographyCreateForm';
import { BiographiesFilterSection } from './components/BiographiesFilterSection';
import { BiographyView } from './components/BiographyView';

export default function BiographiesPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [biographyPendingDelete, setBiographyPendingDelete] =
    useState<IBiographyListItem | null>(null);
  const [biographyPendingView, setBiographyPendingView] =
    useState<IBiographyListItem | null>(null);
  const [filters, setFilters] = useState<IBiographyListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedBiography, resetSelectedBiography, setSelectedBiography } =
    useSelectedBiographyStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    IBiographyListItem,
    IBiographyListFilters
  >({
    url: '/biographies',
    filters,
  });

  const deleteBiographyMutation = useDeleteEntity({
    url: `/biographies/${biographyPendingDelete?.id}`,
    invalidateQueryKeys: [['/biographies']],
    onSuccess: () => {
      showToast({
        message: 'Biografia excluída com sucesso.',
        type: 'success',
      });
      setBiographyPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a biografia.',
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
    resetSelectedBiography();
    setIsFormModalOpen(true);
  };

  const handleEdit = (biography: IBiographyListItem) => {
    setSelectedBiography(biography);
    setIsFormModalOpen(true);
  };

  const handleView = (biography: IBiographyListItem) => {
    setBiographyPendingView(biography);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedBiography();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Biografias
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

      <BiographiesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <BiographiesList
        biographies={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setBiographyPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedBiography ? 'Editar biografia' : 'Nova biografia'}
        size="wide"
      >
        <BiographyCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!biographyPendingView}
        onClose={() => setBiographyPendingView(null)}
        title="Detalhes da Biografia"
        size="wide"
      >
        {biographyPendingView && (
          <BiographyView biographyId={biographyPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!biographyPendingDelete}
        title="Excluir biografia"
        message={`Tem certeza que deseja excluir a biografia "${biographyPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteBiographyMutation.isPending}
        onConfirm={() => deleteBiographyMutation.mutate()}
        onCancel={() => setBiographyPendingDelete(null)}
      />
    </PageContainer>
  );
}
