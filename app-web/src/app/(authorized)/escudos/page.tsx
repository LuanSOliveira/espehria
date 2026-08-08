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
import { IShieldListFilters, IShieldListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedShieldStore } from '@/store';
import { ShieldsList } from './components/ShieldsList';
import { ShieldCreateForm } from './components/ShieldCreateForm';
import { ShieldsFilterSection } from './components/ShieldsFilterSection';
import { ShieldView } from './components/ShieldView';

export default function ShieldsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [shieldPendingDelete, setShieldPendingDelete] =
    useState<IShieldListItem | null>(null);
  const [shieldPendingView, setShieldPendingView] =
    useState<IShieldListItem | null>(null);
  const [filters, setFilters] = useState<IShieldListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedShield, resetSelectedShield, setSelectedShield } =
    useSelectedShieldStore();

  const { data, isLoading } = useGetEntityList<
    IShieldListItem,
    IShieldListFilters
  >({
    url: '/shields',
    filters,
  });

  const deleteShieldMutation = useDeleteEntity({
    url: `/shields/${shieldPendingDelete?.id}`,
    invalidateQueryKeys: [['/shields']],
    onSuccess: () => {
      showToast({
        message: 'Escudo excluído com sucesso.',
        type: 'success',
      });
      setShieldPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível excluir o escudo.',
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
    resetSelectedShield();
    setIsFormModalOpen(true);
  };

  const handleEdit = (shield: IShieldListItem) => {
    setSelectedShield(shield);
    setIsFormModalOpen(true);
  };

  const handleView = (shield: IShieldListItem) => {
    setShieldPendingView(shield);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedShield();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Escudos
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

      <ShieldsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <ShieldsList
        shields={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setShieldPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedShield ? 'Editar escudo' : 'Novo escudo'}
        size="wide"
      >
        <ShieldCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!shieldPendingView}
        onClose={() => setShieldPendingView(null)}
        title="Detalhes do Escudo"
        size="wide"
      >
        {shieldPendingView && <ShieldView shieldId={shieldPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!shieldPendingDelete}
        title="Excluir escudo"
        message={`Tem certeza que deseja excluir o escudo "${shieldPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteShieldMutation.isPending}
        onConfirm={() => deleteShieldMutation.mutate()}
        onCancel={() => setShieldPendingDelete(null)}
      />
    </PageContainer>
  );
}
