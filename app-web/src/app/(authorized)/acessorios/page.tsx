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
  IAccessoryListFilters,
  IAccessoryListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedAccessoryStore } from '@/store';
import { AccessoriesList } from './components/AccessoriesList';
import { AccessoryCreateForm } from './components/AccessoryCreateForm';
import { AccessoriesFilterSection } from './components/AccessoriesFilterSection';
import { AccessoryView } from './components/AccessoryView';

export default function AccessoriesPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [accessoryPendingDelete, setAccessoryPendingDelete] =
    useState<IAccessoryListItem | null>(null);
  const [accessoryPendingView, setAccessoryPendingView] =
    useState<IAccessoryListItem | null>(null);
  const [filters, setFilters] = useState<IAccessoryListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedAccessory, resetSelectedAccessory, setSelectedAccessory } =
    useSelectedAccessoryStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    IAccessoryListItem,
    IAccessoryListFilters
  >({
    url: '/accessories',
    filters,
  });

  const deleteAccessoryMutation = useDeleteEntity({
    url: `/accessories/${accessoryPendingDelete?.id}`,
    invalidateQueryKeys: [['/accessories']],
    onSuccess: () => {
      showToast({
        message: 'Acessório excluído com sucesso.',
        type: 'success',
      });
      setAccessoryPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o acessório.',
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
    resetSelectedAccessory();
    setIsFormModalOpen(true);
  };

  const handleEdit = (accessory: IAccessoryListItem) => {
    setSelectedAccessory(accessory);
    setIsFormModalOpen(true);
  };

  const handleView = (accessory: IAccessoryListItem) => {
    setAccessoryPendingView(accessory);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedAccessory();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Acessórios
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

      <AccessoriesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <AccessoriesList
        accessories={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setAccessoryPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedAccessory ? 'Editar acessório' : 'Novo acessório'}
        size="wide"
      >
        <AccessoryCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!accessoryPendingView}
        onClose={() => setAccessoryPendingView(null)}
        title="Detalhes do Acessório"
        size="wide"
      >
        {accessoryPendingView && (
          <AccessoryView accessoryId={accessoryPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!accessoryPendingDelete}
        title="Excluir acessório"
        message={`Tem certeza que deseja excluir o acessório "${accessoryPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteAccessoryMutation.isPending}
        onConfirm={() => deleteAccessoryMutation.mutate()}
        onCancel={() => setAccessoryPendingDelete(null)}
      />
    </PageContainer>
  );
}
