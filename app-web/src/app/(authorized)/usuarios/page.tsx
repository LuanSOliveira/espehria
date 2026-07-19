'use client';

import { FormEvent, useState } from 'react';
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from '@mui/material';
import { FiEdit2, FiSearch, FiTrash2 } from 'react-icons/fi';

import { PageContainer } from '@/shared/components/Containers';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useGetEntityList } from '@/hooks/Queries';
import { IUser, IUserListFilters } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import { showToast } from '@/shared/util';

const PER_PAGE = 20;

export default function UsersPage() {
  const [emailInput, setEmailInput] = useState('');
  const [filters, setFilters] = useState<IUserListFilters>({
    page: 1,
    perPage: PER_PAGE,
  });

  const { data, isLoading } = useGetEntityList<IUser, IUserListFilters>({
    url: '/users',
    filters,
  });

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      email: emailInput.trim() || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage + 1 }));
  };

  const notImplemented = () => {
    showToast({
      message: 'Funcionalidade em desenvolvimento.',
      type: 'info',
    });
  };

  const users = data?.data ?? [];

  return (
    <PageContainer>
      <Title component="h1" sx={{ textAlign: 'left' }}>
        Usuários
      </Title>

      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          marginTop: '24px',
          maxWidth: 360,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Label htmlFor="users-email-filter">E-mail</Label>
          <DefaultTextInput
            id="users-email-filter"
            placeholder="Buscar por e-mail"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            icon={<FiSearch />}
          />
        </Box>
        <PrimaryButton
          type="submit"
          sx={{ width: 'auto', padding: '12px 24px' }}
        >
          Filtrar
        </PrimaryButton>
      </Box>

      <TableContainer
        sx={{
          marginTop: '24px',
          borderRadius: '6px',
          border: `1px solid ${APP_COLORS.gold}`,
          backgroundImage: `linear-gradient(160deg, ${APP_COLORS.parchmentLight} 0%, ${APP_COLORS.parchmentMid} 60%, ${APP_COLORS.parchmentDark} 100%)`,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                <Label component="span" sx={{ margin: 0 }}>
                  E-mail
                </Label>
              </TableCell>
              <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                <Label component="span" sx={{ margin: 0 }}>
                  Nome
                </Label>
              </TableCell>
              <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
                <Label component="span" sx={{ margin: 0 }}>
                  Ações
                </Label>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} sx={{ borderColor: APP_COLORS.gold }}>
                  <DefaultText>Nenhum usuário encontrado.</DefaultText>
                </TableCell>
              </TableRow>
            )}

            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                  <DefaultText>{user.email}</DefaultText>
                </TableCell>
                <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                  <DefaultText>{user.name}</DefaultText>
                </TableCell>
                <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
                  <Tooltip title="Editar">
                    <IconButton
                      aria-label="Editar"
                      onClick={notImplemented}
                      sx={{ color: APP_COLORS.textBrownDark }}
                    >
                      <FiEdit2 />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      aria-label="Excluir"
                      onClick={notImplemented}
                      sx={{ color: APP_COLORS.textBrownDark }}
                    >
                      <FiTrash2 />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={(filters.page ?? 1) - 1}
          rowsPerPage={PER_PAGE}
          rowsPerPageOptions={[PER_PAGE]}
          onPageChange={handlePageChange}
          sx={{
            color: APP_COLORS.textBrownDark,
            borderTop: `1px solid ${APP_COLORS.gold}`,
          }}
        />
      </TableContainer>
    </PageContainer>
  );
}
