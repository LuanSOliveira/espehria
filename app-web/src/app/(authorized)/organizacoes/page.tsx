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
  IOrganizationListFilters,
  IOrganizationListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedOrganizationStore } from '@/store';
import { OrganizationsList } from './components/OrganizationsList';
import { OrganizationCreateForm } from './components/OrganizationCreateForm';
import { OrganizationsFilterSection } from './components/OrganizationsFilterSection';
import { OrganizationView } from './components/OrganizationView';

export default function OrganizationsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [organizationPendingDelete, setOrganizationPendingDelete] =
    useState<IOrganizationListItem | null>(null);
  const [organizationPendingView, setOrganizationPendingView] =
    useState<IOrganizationListItem | null>(null);
  const [filters, setFilters] = useState<IOrganizationListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const {
    selectedOrganization,
    resetSelectedOrganization,
    setSelectedOrganization,
  } = useSelectedOrganizationStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    IOrganizationListItem,
    IOrganizationListFilters
  >({
    url: '/organizations',
    filters,
  });

  const deleteOrganizationMutation = useDeleteEntity({
    url: `/organizations/${organizationPendingDelete?.id}`,
    invalidateQueryKeys: [['/organizations']],
    onSuccess: () => {
      showToast({
        message: 'Organização excluída com sucesso.',
        type: 'success',
      });
      setOrganizationPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a organização.',
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
    resetSelectedOrganization();
    setIsFormModalOpen(true);
  };

  const handleEdit = (organization: IOrganizationListItem) => {
    setSelectedOrganization(organization);
    setIsFormModalOpen(true);
  };

  const handleView = (organization: IOrganizationListItem) => {
    setOrganizationPendingView(organization);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedOrganization();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Organizações
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

      <OrganizationsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <OrganizationsList
        organizations={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setOrganizationPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedOrganization ? 'Editar organização' : 'Nova organização'}
        size="wide"
      >
        <OrganizationCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!organizationPendingView}
        onClose={() => setOrganizationPendingView(null)}
        title="Detalhes da Organização"
        size="wide"
      >
        {organizationPendingView && (
          <OrganizationView organizationId={organizationPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!organizationPendingDelete}
        title="Excluir organização"
        message={`Tem certeza que deseja excluir a organização "${organizationPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteOrganizationMutation.isPending}
        onConfirm={() => deleteOrganizationMutation.mutate()}
        onCancel={() => setOrganizationPendingDelete(null)}
      />
    </PageContainer>
  );
}
