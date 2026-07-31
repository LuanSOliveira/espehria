import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText } from '@/shared/components/Texts';
import { ITalentListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface TalentsListItemProps {
  talent: ITalentListItem;
  onView: (talent: ITalentListItem) => void;
  onEdit: (talent: ITalentListItem) => void;
  onDelete: (talent: ITalentListItem) => void;
}

export const TalentsListItem = ({
  talent,
  onView,
  onEdit,
  onDelete,
}: TalentsListItemProps) => {
  const isGoogleUser = useIsGoogleUser();

  return (
    <TableRow
      sx={{
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
      }}
    >
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{talent.name}</DefaultText>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Visualizar">
          <IconButton
            aria-label="Visualizar"
            onClick={() => onView(talent)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEye />
          </IconButton>
        </Tooltip>
        {!isGoogleUser && (
          <>
            <Tooltip title="Editar">
              <IconButton
                aria-label="Editar"
                onClick={() => onEdit(talent)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiEdit2 />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton
                aria-label="Excluir"
                onClick={() => onDelete(talent)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiTrash2 />
              </IconButton>
            </Tooltip>
          </>
        )}
      </TableCell>
    </TableRow>
  );
};
