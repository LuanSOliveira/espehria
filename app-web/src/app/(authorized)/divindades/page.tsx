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
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { IDivinityListFilters, IDivinityListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedDivinityStore } from '@/store';
import { DivinitiesList } from './components/DivinitiesList';
import { DivinityCreateForm } from './components/DivinityCreateForm';
import { DivinitiesFilterSection } from './components/DivinitiesFilterSection';
import { DivinityView } from './components/DivinityView';

export default function DivinitiesPage() {
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [divinityPendingDelete, setDivinityPendingDelete] =
    useState<IDivinityListItem | null>(null);
  const [divinityPendingView, setDivinityPendingView] =
    useState<IDivinityListItem | null>(null);
  const [filters, setFilters] = useState<IDivinityListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedDivinity, resetSelectedDivinity, setSelectedDivinity } =
    useSelectedDivinityStore();

  const { data, isLoading } = useGetEntityList<
    IDivinityListItem,
    IDivinityListFilters
  >({
    url: '/divinities',
    filters,
  });

  const deleteDivinityMutation = useDeleteEntity({
    url: `/divinities/${divinityPendingDelete?.id}`,
    invalidateQueryKeys: [['/divinities']],
    onSuccess: () => {
      showToast({
        message: 'Divindade excluída com sucesso.',
        type: 'success',
      });
      setDivinityPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a divindade.',
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
    resetSelectedDivinity();
    setIsFormModalOpen(true);
  };

  const handleEdit = (divinity: IDivinityListItem) => {
    setSelectedDivinity(divinity);
    setIsFormModalOpen(true);
  };

  const handleView = (divinity: IDivinityListItem) => {
    setDivinityPendingView(divinity);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedDivinity();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Divindades
        </Title>
        <PrimaryButton
          type="button"
          onClick={handleOpenCreateModal}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Novo
        </PrimaryButton>
      </div>

      <DivinitiesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <DivinitiesList
        divinities={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setDivinityPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedDivinity ? 'Editar divindade' : 'Nova divindade'}
        size="wide"
      >
        <DivinityCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!divinityPendingView}
        onClose={() => setDivinityPendingView(null)}
        title="Detalhes da Divindade"
        size="wide"
      >
        {divinityPendingView && (
          <DivinityView divinityId={divinityPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!divinityPendingDelete}
        title="Excluir divindade"
        message={`Tem certeza que deseja excluir a divindade "${divinityPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteDivinityMutation.isPending}
        onConfirm={() => deleteDivinityMutation.mutate()}
        onCancel={() => setDivinityPendingDelete(null)}
      />
    </PageContainer>
  );
}
