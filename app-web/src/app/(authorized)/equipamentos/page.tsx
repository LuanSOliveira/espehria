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
import { IEquipmentListFilters, IEquipmentListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedEquipmentStore } from '@/store';
import { EquipmentList } from './components/EquipmentList';
import { EquipmentCreateForm } from './components/EquipmentCreateForm';
import { EquipmentFilterSection } from './components/EquipmentFilterSection';
import { EquipmentView } from './components/EquipmentView';

export default function EquipmentPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [equipmentPendingDelete, setEquipmentPendingDelete] =
    useState<IEquipmentListItem | null>(null);
  const [equipmentPendingView, setEquipmentPendingView] =
    useState<IEquipmentListItem | null>(null);
  const [filters, setFilters] = useState<IEquipmentListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedEquipment, resetSelectedEquipment, setSelectedEquipment } =
    useSelectedEquipmentStore();

  const { data, isLoading } = useGetEntityList<
    IEquipmentListItem,
    IEquipmentListFilters
  >({
    url: '/equipment',
    filters,
  });

  const deleteEquipmentMutation = useDeleteEntity({
    url: `/equipment/${equipmentPendingDelete?.id}`,
    invalidateQueryKeys: [['/equipment']],
    onSuccess: () => {
      showToast({
        message: 'Equipamento excluído com sucesso.',
        type: 'success',
      });
      setEquipmentPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o equipamento.',
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
    resetSelectedEquipment();
    setIsFormModalOpen(true);
  };

  const handleEdit = (equipment: IEquipmentListItem) => {
    setSelectedEquipment(equipment);
    setIsFormModalOpen(true);
  };

  const handleView = (equipment: IEquipmentListItem) => {
    setEquipmentPendingView(equipment);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedEquipment();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Equipamentos
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

      <EquipmentFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <EquipmentList
        equipment={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setEquipmentPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedEquipment ? 'Editar equipamento' : 'Novo equipamento'}
        size="wide"
      >
        <EquipmentCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!equipmentPendingView}
        onClose={() => setEquipmentPendingView(null)}
        title="Detalhes do Equipamento"
        size="wide"
      >
        {equipmentPendingView && (
          <EquipmentView equipmentId={equipmentPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!equipmentPendingDelete}
        title="Excluir equipamento"
        message={`Tem certeza que deseja excluir o equipamento "${equipmentPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteEquipmentMutation.isPending}
        onConfirm={() => deleteEquipmentMutation.mutate()}
        onCancel={() => setEquipmentPendingDelete(null)}
      />
    </PageContainer>
  );
}
