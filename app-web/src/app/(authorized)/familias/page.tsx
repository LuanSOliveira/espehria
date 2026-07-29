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
import { IFamilyListFilters, IFamilyListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedFamilyStore } from '@/store';
import { FamiliesList } from './components/FamiliesList';
import { FamilyCreateForm } from './components/FamilyCreateForm';
import { FamiliesFilterSection } from './components/FamiliesFilterSection';
import { FamilyView } from './components/FamilyView';

export default function FamiliesPage() {
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [familyPendingDelete, setFamilyPendingDelete] =
    useState<IFamilyListItem | null>(null);
  const [familyPendingView, setFamilyPendingView] =
    useState<IFamilyListItem | null>(null);
  const [filters, setFilters] = useState<IFamilyListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedFamily, resetSelectedFamily, setSelectedFamily } =
    useSelectedFamilyStore();

  const { data, isLoading } = useGetEntityList<
    IFamilyListItem,
    IFamilyListFilters
  >({
    url: '/families',
    filters,
  });

  const deleteFamilyMutation = useDeleteEntity({
    url: `/families/${familyPendingDelete?.id}`,
    invalidateQueryKeys: [['/families']],
    onSuccess: () => {
      showToast({
        message: 'Família excluída com sucesso.',
        type: 'success',
      });
      setFamilyPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a família.',
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
    resetSelectedFamily();
    setIsFormModalOpen(true);
  };

  const handleEdit = (family: IFamilyListItem) => {
    setSelectedFamily(family);
    setIsFormModalOpen(true);
  };

  const handleView = (family: IFamilyListItem) => {
    setFamilyPendingView(family);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedFamily();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Famílias
        </Title>
        <PrimaryButton
          type="button"
          onClick={handleOpenCreateModal}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Novo
        </PrimaryButton>
      </div>

      <FamiliesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <FamiliesList
        families={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setFamilyPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedFamily ? 'Editar família' : 'Nova família'}
        size="wide"
      >
        <FamilyCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!familyPendingView}
        onClose={() => setFamilyPendingView(null)}
        title="Detalhes da Família"
        size="wide"
      >
        {familyPendingView && (
          <FamilyView familyId={familyPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!familyPendingDelete}
        title="Excluir família"
        message={`Tem certeza que deseja excluir a família "${familyPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteFamilyMutation.isPending}
        onConfirm={() => deleteFamilyMutation.mutate()}
        onCancel={() => setFamilyPendingDelete(null)}
      />
    </PageContainer>
  );
}
