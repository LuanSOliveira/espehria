import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { TagBadge } from '@/shared/components/TagBadge';
import { IRaceListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface RacesListItemProps {
  race: IRaceListItem;
  onView: (race: IRaceListItem) => void;
  onEdit: (race: IRaceListItem) => void;
  onDelete: (race: IRaceListItem) => void;
}

export const RacesListItem = ({
  race,
  onView,
  onEdit,
  onDelete,
}: RacesListItemProps) => {
  return (
    <TableRow>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <ImageAvatarPreview imageUrl={race.referenceImageUrl} alt={race.name} />
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{race.name}</DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{race.category.name}</DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <div className="flex flex-wrap items-center gap-1">
          {race.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Visualizar">
          <IconButton
            aria-label="Visualizar"
            onClick={() => onView(race)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEye />
          </IconButton>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton
            aria-label="Editar"
            onClick={() => onEdit(race)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEdit2 />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            aria-label="Excluir"
            onClick={() => onDelete(race)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiTrash2 />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
