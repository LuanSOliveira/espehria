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
import { IWeaponListFilters, IWeaponListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedWeaponStore } from '@/store';
import { WeaponsList } from './components/WeaponsList';
import { WeaponCreateForm } from './components/WeaponCreateForm';
import { WeaponsFilterSection } from './components/WeaponsFilterSection';
import { WeaponView } from './components/WeaponView';

export default function WeaponsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [weaponPendingDelete, setWeaponPendingDelete] =
    useState<IWeaponListItem | null>(null);
  const [weaponPendingView, setWeaponPendingView] =
    useState<IWeaponListItem | null>(null);
  const [filters, setFilters] = useState<IWeaponListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedWeapon, resetSelectedWeapon, setSelectedWeapon } =
    useSelectedWeaponStore();

  const { data, isLoading } = useGetEntityList<
    IWeaponListItem,
    IWeaponListFilters
  >({
    url: '/weapons',
    filters,
  });

  const deleteWeaponMutation = useDeleteEntity({
    url: `/weapons/${weaponPendingDelete?.id}`,
    invalidateQueryKeys: [['/weapons']],
    onSuccess: () => {
      showToast({
        message: 'Arma excluída com sucesso.',
        type: 'success',
      });
      setWeaponPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível excluir a arma.',
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
    resetSelectedWeapon();
    setIsFormModalOpen(true);
  };

  const handleEdit = (weapon: IWeaponListItem) => {
    setSelectedWeapon(weapon);
    setIsFormModalOpen(true);
  };

  const handleView = (weapon: IWeaponListItem) => {
    setWeaponPendingView(weapon);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedWeapon();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Armas
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

      <WeaponsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <WeaponsList
        weapons={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setWeaponPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedWeapon ? 'Editar arma' : 'Nova arma'}
        size="wide"
      >
        <WeaponCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!weaponPendingView}
        onClose={() => setWeaponPendingView(null)}
        title="Detalhes da Arma"
        size="wide"
      >
        {weaponPendingView && <WeaponView weaponId={weaponPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!weaponPendingDelete}
        title="Excluir arma"
        message={`Tem certeza que deseja excluir a arma "${weaponPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteWeaponMutation.isPending}
        onConfirm={() => deleteWeaponMutation.mutate()}
        onCancel={() => setWeaponPendingDelete(null)}
      />
    </PageContainer>
  );
}
