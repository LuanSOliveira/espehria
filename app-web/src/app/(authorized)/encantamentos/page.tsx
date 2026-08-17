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
import { IEnchantmentListFilters, IEnchantmentListItem } from '@/shared/interfaces';
import {
  APP_DEFAULT_PAGE_SIZE,
  EquipmentApplicableTypeOption,
} from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedEnchantmentStore } from '@/store';
import { EnchantmentsList } from './components/EnchantmentsList';
import { EnchantmentCreateForm } from './components/EnchantmentCreateForm';
import { EnchantmentsFilterSection } from './components/EnchantmentsFilterSection';
import { EnchantmentView } from './components/EnchantmentView';

export default function EnchantmentsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [typeInput, setTypeInput] = useState<EquipmentApplicableTypeOption | null>(
    null,
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [enchantmentPendingDelete, setEnchantmentPendingDelete] =
    useState<IEnchantmentListItem | null>(null);
  const [enchantmentPendingView, setEnchantmentPendingView] =
    useState<IEnchantmentListItem | null>(null);
  const [filters, setFilters] = useState<IEnchantmentListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const {
    selectedEnchantment,
    resetSelectedEnchantment,
    setSelectedEnchantment,
  } = useSelectedEnchantmentStore();

  const { data, isLoading } = useGetEntityList<
    IEnchantmentListItem,
    IEnchantmentListFilters
  >({
    url: '/enchantments',
    filters,
  });

  const deleteEnchantmentMutation = useDeleteEntity({
    url: `/enchantments/${enchantmentPendingDelete?.id}`,
    invalidateQueryKeys: [['/enchantments']],
    onSuccess: () => {
      showToast({
        message: 'Encantamento excluído com sucesso.',
        type: 'success',
      });
      setEnchantmentPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o encantamento.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      type: typeInput?.value ?? undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setTypeInput(null);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedEnchantment();
    setIsFormModalOpen(true);
  };

  const handleEdit = (enchantment: IEnchantmentListItem) => {
    setSelectedEnchantment(enchantment);
    setIsFormModalOpen(true);
  };

  const handleView = (enchantment: IEnchantmentListItem) => {
    setEnchantmentPendingView(enchantment);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedEnchantment();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Encantamentos
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

      <EnchantmentsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        typeValue={typeInput}
        onTypeChange={setTypeInput}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <EnchantmentsList
        enchantments={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setEnchantmentPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedEnchantment ? 'Editar encantamento' : 'Novo encantamento'}
        size="wide"
      >
        <EnchantmentCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!enchantmentPendingView}
        onClose={() => setEnchantmentPendingView(null)}
        title="Detalhes do Encantamento"
        size="wide"
      >
        {enchantmentPendingView && (
          <EnchantmentView enchantmentId={enchantmentPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!enchantmentPendingDelete}
        title="Excluir encantamento"
        message={`Tem certeza que deseja excluir o encantamento "${enchantmentPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteEnchantmentMutation.isPending}
        onConfirm={() => deleteEnchantmentMutation.mutate()}
        onCancel={() => setEnchantmentPendingDelete(null)}
      />
    </PageContainer>
  );
}
