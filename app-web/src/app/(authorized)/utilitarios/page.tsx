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
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { IUtilityListFilters, IUtilityListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedUtilityStore } from '@/store';
import { UtilitiesList } from './components/UtilitiesList';
import { UtilityCreateForm } from './components/UtilityCreateForm';
import { UtilitiesFilterSection } from './components/UtilitiesFilterSection';
import { UtilityView } from './components/UtilityView';

export default function UtilitiesPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [utilityPendingDelete, setUtilityPendingDelete] =
    useState<IUtilityListItem | null>(null);
  const [utilityPendingView, setUtilityPendingView] =
    useState<IUtilityListItem | null>(null);
  const [filters, setFilters] = useState<IUtilityListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedUtility, resetSelectedUtility, setSelectedUtility } =
    useSelectedUtilityStore();

  const { data, isLoading } = useGetEntityList<
    IUtilityListItem,
    IUtilityListFilters
  >({
    url: '/utilities',
    filters,
  });

  const deleteUtilityMutation = useDeleteEntity({
    url: `/utilities/${utilityPendingDelete?.id}`,
    invalidateQueryKeys: [['/utilities']],
    onSuccess: () => {
      showToast({
        message: 'Utilitário excluído com sucesso.',
        type: 'success',
      });
      setUtilityPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o utilitário.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedUtility();
    setIsFormModalOpen(true);
  };

  const handleEdit = (utility: IUtilityListItem) => {
    setSelectedUtility(utility);
    setIsFormModalOpen(true);
  };

  const handleView = (utility: IUtilityListItem) => {
    setUtilityPendingView(utility);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedUtility();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Utilitários
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

      <UtilitiesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <UtilitiesList
        utilities={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setUtilityPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedUtility ? 'Editar utilitário' : 'Novo utilitário'}
        size="wide"
      >
        <UtilityCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!utilityPendingView}
        onClose={() => setUtilityPendingView(null)}
        title="Detalhes do Utilitário"
        size="wide"
      >
        {utilityPendingView && (
          <UtilityView utilityId={utilityPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!utilityPendingDelete}
        title="Excluir utilitário"
        message={`Tem certeza que deseja excluir o utilitário "${utilityPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteUtilityMutation.isPending}
        onConfirm={() => deleteUtilityMutation.mutate()}
        onCancel={() => setUtilityPendingDelete(null)}
      />
    </PageContainer>
  );
}
