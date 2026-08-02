'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import { DefaultAutocompleteInput } from '@/shared/components/Inputs';
import { DefaultText, Label } from '@/shared/components/Texts';
import { SecondaryButton } from '@/shared/components/Buttons';
import { useGetEntityList } from '@/hooks/Queries';
import { IGoogleUserListFilters, IUser } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface CampaignAllowedUsersFieldProps {
  value: IUser[];
  onChange: (value: IUser[]) => void;
}

export const CampaignAllowedUsersField = ({
  value,
  onChange,
}: CampaignAllowedUsersFieldProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  const { data } = useGetEntityList<IUser, IGoogleUserListFilters>({
    url: '/users/google',
    filters: { search: searchText || undefined, perPage: 10 },
  });

  const selectedIds = value.map((user) => user.id);
  const options = (data?.data ?? []).filter(
    (user) => !selectedIds.includes(user.id),
  );

  const handleAdd = () => {
    if (!selectedUser) {
      return;
    }

    onChange([...value, selectedUser]);
    setSelectedUser(null);
    setSearchText('');
  };

  const handleRemove = (userId: string) => {
    onChange(value.filter((user) => user.id !== userId));
  };

  return (
    <div className="flex flex-col gap-3">
      <Label component="span" sx={{ margin: 0 }}>
        Usuários Permitidos
      </Label>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-50 flex-1">
          <DefaultAutocompleteInput<IUser>
            id="campaign-allowed-users-search"
            options={options}
            getOptionLabel={(user) => `${user.name} (${user.email})`}
            value={selectedUser}
            onChange={setSelectedUser}
            inputValue={searchText}
            onInputChange={setSearchText}
            placeholder="Buscar usuário Google por nome ou e-mail"
          />
        </div>

        <SecondaryButton
          type="button"
          disabled={!selectedUser}
          onClick={handleAdd}
        >
          Adicionar
        </SecondaryButton>
      </div>

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <DefaultText className="flex-1">
                {user.name} — {user.email}
              </DefaultText>

              <Tooltip title="Remover">
                <IconButton
                  aria-label={`Remover ${user.name} dos usuários permitidos`}
                  onClick={() => handleRemove(user.id)}
                  sx={{ color: APP_COLORS.textBrownDark }}
                >
                  <FiTrash2 />
                </IconButton>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <DefaultText>Nenhum usuário permitido adicionado.</DefaultText>
      )}
    </div>
  );
};
