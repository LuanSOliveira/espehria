'use client';

import { SubmitEvent, useState } from 'react';
import { FiSearch } from 'react-icons/fi';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { IUser, IUserListFilters } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedUserStore } from '@/store';
import { UsersList } from './components/UsersList';
import { UserCreateForm } from './components/UserCreateForm';

export default function UsersPage() {
  const [emailInput, setEmailInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [userPendingDelete, setUserPendingDelete] = useState<IUser | null>(
    null,
  );
  const [filters, setFilters] = useState<IUserListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedUser, resetSelectedUser, setSelectedUser } =
    useSelectedUserStore();

  const { data, isLoading } = useGetEntityList<IUser, IUserListFilters>({
    url: '/users',
    filters,
  });

  const deleteUserMutation = useDeleteEntity({
    url: `/users/${userPendingDelete?.id}`,
    invalidateQueryKeys: [['/users']],
    onSuccess: () => {
      showToast({
        message: 'Usuário excluído com sucesso.',
        type: 'success',
      });
      setUserPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o usuário.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      email: emailInput.trim() || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedUser();
    setIsFormModalOpen(true);
  };

  const handleEdit = (user: IUser) => {
    setSelectedUser(user);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedUser();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Usuários
        </Title>
        <PrimaryButton
          type="button"
          onClick={handleOpenCreateModal}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Novo
        </PrimaryButton>
      </div>

      <form
        onSubmit={handleSearch}
        className="mt-6 flex max-w-90 items-end gap-3"
      >
        <div className="flex-1">
          <DefaultTextInput
            id="users-email-filter"
            label="E-mail"
            placeholder="Buscar por e-mail"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            icon={<FiSearch />}
          />
        </div>
        <PrimaryButton
          type="submit"
          sx={{ width: 'auto', padding: '12px 24px' }}
        >
          Filtrar
        </PrimaryButton>
      </form>

      <UsersList
        users={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={setUserPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedUser ? 'Editar usuário' : 'Novo usuário'}
      >
        <UserCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ConfirmationModal
        open={!!userPendingDelete}
        title="Excluir usuário"
        message={`Tem certeza que deseja excluir o usuário "${userPendingDelete?.email}"?`}
        confirmLabel="Excluir"
        isLoading={deleteUserMutation.isPending}
        onConfirm={() => deleteUserMutation.mutate()}
        onCancel={() => setUserPendingDelete(null)}
      />
    </PageContainer>
  );
}
