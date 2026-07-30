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
import {
  IConsumableListFilters,
  IConsumableListItem,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedConsumableStore } from '@/store';
import { ConsumablesList } from './components/ConsumablesList';
import { ConsumableCreateForm } from './components/ConsumableCreateForm';
import { ConsumablesFilterSection } from './components/ConsumablesFilterSection';
import { ConsumableView } from './components/ConsumableView';

export default function ConsumablesPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [consumablePendingDelete, setConsumablePendingDelete] =
    useState<IConsumableListItem | null>(null);
  const [consumablePendingView, setConsumablePendingView] =
    useState<IConsumableListItem | null>(null);
  const [filters, setFilters] = useState<IConsumableListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedConsumable, resetSelectedConsumable, setSelectedConsumable } =
    useSelectedConsumableStore();

  const { data, isLoading } = useGetEntityList<
    IConsumableListItem,
    IConsumableListFilters
  >({
    url: '/consumables',
    filters,
  });

  const deleteConsumableMutation = useDeleteEntity({
    url: `/consumables/${consumablePendingDelete?.id}`,
    invalidateQueryKeys: [['/consumables']],
    onSuccess: () => {
      showToast({
        message: 'Consumível excluído com sucesso.',
        type: 'success',
      });
      setConsumablePendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o consumível.',
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
    resetSelectedConsumable();
    setIsFormModalOpen(true);
  };

  const handleEdit = (consumable: IConsumableListItem) => {
    setSelectedConsumable(consumable);
    setIsFormModalOpen(true);
  };

  const handleView = (consumable: IConsumableListItem) => {
    setConsumablePendingView(consumable);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedConsumable();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Consumíveis
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

      <ConsumablesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <ConsumablesList
        consumables={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setConsumablePendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedConsumable ? 'Editar consumível' : 'Novo consumível'}
        size="wide"
      >
        <ConsumableCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!consumablePendingView}
        onClose={() => setConsumablePendingView(null)}
        title="Detalhes do Consumível"
        size="wide"
      >
        {consumablePendingView && (
          <ConsumableView consumableId={consumablePendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!consumablePendingDelete}
        title="Excluir consumível"
        message={`Tem certeza que deseja excluir o consumível "${consumablePendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteConsumableMutation.isPending}
        onConfirm={() => deleteConsumableMutation.mutate()}
        onCancel={() => setConsumablePendingDelete(null)}
      />
    </PageContainer>
  );
}
