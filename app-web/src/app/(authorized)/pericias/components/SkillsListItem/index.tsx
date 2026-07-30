import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText } from '@/shared/components/Texts';
import { ISkillListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface SkillsListItemProps {
  skill: ISkillListItem;
  onView: (skill: ISkillListItem) => void;
  onEdit: (skill: ISkillListItem) => void;
  onDelete: (skill: ISkillListItem) => void;
}

export const SkillsListItem = ({
  skill,
  onView,
  onEdit,
  onDelete,
}: SkillsListItemProps) => {
  const isGoogleUser = useIsGoogleUser();

  return (
    <TableRow
      sx={{
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
      }}
    >
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{skill.name}</DefaultText>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Visualizar">
          <IconButton
            aria-label="Visualizar"
            onClick={() => onView(skill)}
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
                onClick={() => onEdit(skill)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiEdit2 />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton
                aria-label="Excluir"
                onClick={() => onDelete(skill)}
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
