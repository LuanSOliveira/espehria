import { Box, IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { ITag } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface TagsListItemProps {
  tag: ITag;
  onEdit: (tag: ITag) => void;
  onDelete: (tag: ITag) => void;
}

export const TagsListItem = ({ tag, onEdit, onDelete }: TagsListItemProps) => {
  return (
    <TableRow>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{tag.name}</DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <div className="flex items-center gap-2">
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '4px',
              border: `1px solid ${APP_COLORS.goldDark}`,
              backgroundColor: tag.color,
            }}
          />
          <DefaultText>{tag.color}</DefaultText>
        </div>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Editar">
          <IconButton
            aria-label="Editar"
            onClick={() => onEdit(tag)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEdit2 />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            aria-label="Excluir"
            onClick={() => onDelete(tag)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiTrash2 />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
