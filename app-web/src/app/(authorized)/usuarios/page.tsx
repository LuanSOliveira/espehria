'use client';

import { SubmitEvent, useState } from 'react';
import { FiSearch } from 'react-icons/fi';

import { PageContainer } from '@/shared/components/Containers';
import { Label, Title } from '@/shared/components/Texts';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useGetEntityList } from '@/hooks/Queries';
import { IUser, IUserListFilters } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { UsersList } from './components/UsersList';

export default function UsersPage() {
  const [emailInput, setEmailInput] = useState('');
  const [filters, setFilters] = useState<IUserListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { data, isLoading } = useGetEntityList<IUser, IUserListFilters>({
    url: '/users',
    filters,
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

  const notImplemented = () => {
    showToast({
      message: 'Funcionalidade em desenvolvimento.',
      type: 'info',
    });
  };

  return (
    <PageContainer>
      <Title component="h1" sx={{ textAlign: 'left' }}>
        Usuários
      </Title>

      <form
        onSubmit={handleSearch}
        className="mt-6 flex max-w-90 items-end gap-3"
      >
        <div className="flex-1">
          <Label htmlFor="users-email-filter">E-mail</Label>
          <DefaultTextInput
            id="users-email-filter"
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
        onEdit={notImplemented}
        onDelete={notImplemented}
      />
    </PageContainer>
  );
}
