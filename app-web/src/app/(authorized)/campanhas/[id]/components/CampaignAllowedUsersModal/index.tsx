'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { useDeleteEntity } from '@/hooks/Queries';
import { ConfirmationModal, ViewModal } from '@/shared/components/Modals';
import { DefaultText } from '@/shared/components/Texts';
import { ICampaign, IUser } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { showToast } from '@/shared/util';

export interface CampaignAllowedUsersModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  allowedUsers: IUser[];
}

export const CampaignAllowedUsersModal = ({
  open,
  onClose,
  campaignId,
  allowedUsers,
}: CampaignAllowedUsersModalProps) => {
  const isGoogleUser = useIsGoogleUser();
  const [userPendingRemoval, setUserPendingRemoval] = useState<IUser | null>(
    null,
  );

  const removeAllowedUserMutation = useDeleteEntity<ICampaign>({
    url: `/campaigns/${campaignId}/allowed-users/${userPendingRemoval?.id}`,
    invalidateQueryKeys: [[`/campaigns/${campaignId}`]],
    onSuccess: () => {
      showToast({
        message: 'Usuário removido dos usuários permitidos com sucesso.',
        type: 'success',
      });
      setUserPendingRemoval(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível remover o usuário dos usuários permitidos.',
        type: 'error',
      });
    },
  });

  return (
    <>
      <ViewModal open={open} onClose={onClose} title="Usuários Permitidos">
        {allowedUsers.length === 0 && (
          <DefaultText>Nenhum usuário permitido nesta campanha.</DefaultText>
        )}

        {allowedUsers.length > 0 && (
          <div className="flex flex-col gap-2">
            {allowedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-3 py-2"
                style={APP_CONTAINER_STYLES.detailInfoField}
              >
                <DefaultText className="flex-1">
                  {user.name} — {user.email}
                </DefaultText>

                {!isGoogleUser && (
                  <Tooltip title="Remover">
                    <IconButton
                      aria-label={`Remover ${user.name} dos usuários permitidos`}
                      onClick={() => setUserPendingRemoval(user)}
                      sx={{ color: APP_COLORS.textBrownDark }}
                    >
                      <FiTrash2 />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!userPendingRemoval}
        title="Remover usuário permitido"
        message={`Tem certeza que deseja remover "${userPendingRemoval?.name}" dos usuários permitidos desta campanha? As fichas vinculadas a este usuário nesta campanha também serão desvinculadas.`}
        confirmLabel="Remover"
        isLoading={removeAllowedUserMutation.isPending}
        onConfirm={() => removeAllowedUserMutation.mutate()}
        onCancel={() => setUserPendingRemoval(null)}
      />
    </>
  );
};
