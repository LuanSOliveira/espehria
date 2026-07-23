import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { IUser } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface UsersListItemProps {
  user: IUser;
  onEdit: (user: IUser) => void;
  onDelete: (user: IUser) => void;
}

export const UsersListItem = ({
  user,
  onEdit,
  onDelete,
}: UsersListItemProps) => {
  return (
    <TableRow
      sx={{
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
      }}
    >
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
            onClick={() => onEdit(user)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEdit2 />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            aria-label="Excluir"
            onClick={() => onDelete(user)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiTrash2 />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
