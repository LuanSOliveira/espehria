import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { GiDeathSkull } from 'react-icons/gi';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { TagBadge } from '@/shared/components/TagBadge';
import { ICharacterListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface CharactersListItemProps {
  character: ICharacterListItem;
  onView: (character: ICharacterListItem) => void;
  onEdit: (character: ICharacterListItem) => void;
  onDelete: (character: ICharacterListItem) => void;
}

export const CharactersListItem = ({
  character,
  onView,
  onEdit,
  onDelete,
}: CharactersListItemProps) => {
  return (
    <TableRow
      sx={{
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
      }}
    >
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <ImageAvatarPreview
          imageUrl={character.referenceImage}
          alt={character.name}
        />
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <div className="flex items-center gap-2">
          <DefaultText>{character.name}</DefaultText>
          {character.isDead && (
            <Tooltip title="Morto">
              <span className="flex items-center">
                <GiDeathSkull
                  style={{ fontSize: 16, color: APP_COLORS.textBrownDark }}
                />
              </span>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{character.race?.name ?? '-'}</DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <div className="flex flex-wrap items-center gap-1">
          {character.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Visualizar">
          <IconButton
            aria-label="Visualizar"
            onClick={() => onView(character)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEye />
          </IconButton>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton
            aria-label="Editar"
            onClick={() => onEdit(character)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEdit2 />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            aria-label="Excluir"
            onClick={() => onDelete(character)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiTrash2 />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
