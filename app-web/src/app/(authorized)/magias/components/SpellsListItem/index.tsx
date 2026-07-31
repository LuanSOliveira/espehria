import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { TagBadge } from '@/shared/components/TagBadge';
import { ISpellListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface SpellsListItemProps {
  spell: ISpellListItem;
  onView: (spell: ISpellListItem) => void;
  onEdit: (spell: ISpellListItem) => void;
  onDelete: (spell: ISpellListItem) => void;
}

export const SpellsListItem = ({
  spell,
  onView,
  onEdit,
  onDelete,
}: SpellsListItemProps) => {
  const isGoogleUser = useIsGoogleUser();

  return (
    <TableRow
      sx={{
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
      }}
    >
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <ImageAvatarPreview imageUrl={spell.referenceImage} alt={spell.name} />
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{spell.name}</DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <div className="flex flex-wrap items-center gap-1">
          {spell.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Visualizar">
          <IconButton
            aria-label="Visualizar"
            onClick={() => onView(spell)}
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
                onClick={() => onEdit(spell)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiEdit2 />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton
                aria-label="Excluir"
                onClick={() => onDelete(spell)}
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
