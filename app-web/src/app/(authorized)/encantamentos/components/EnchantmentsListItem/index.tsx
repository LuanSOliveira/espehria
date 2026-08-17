import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText } from '@/shared/components/Texts';
import { IEnchantmentListItem } from '@/shared/interfaces';
import { APP_COLORS, EQUIPMENT_APPLICABLE_TYPE_LABELS } from '@/shared/constants';

export interface EnchantmentsListItemProps {
  enchantment: IEnchantmentListItem;
  onView: (enchantment: IEnchantmentListItem) => void;
  onEdit: (enchantment: IEnchantmentListItem) => void;
  onDelete: (enchantment: IEnchantmentListItem) => void;
}

export const EnchantmentsListItem = ({
  enchantment,
  onView,
  onEdit,
  onDelete,
}: EnchantmentsListItemProps) => {
  const isGoogleUser = useIsGoogleUser();

  return (
    <TableRow
      sx={{
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
      }}
    >
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{enchantment.name}</DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>
          {enchantment.type
            ? EQUIPMENT_APPLICABLE_TYPE_LABELS[enchantment.type]
            : 'Não informado'}
        </DefaultText>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Visualizar">
          <IconButton
            aria-label="Visualizar"
            onClick={() => onView(enchantment)}
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
                onClick={() => onEdit(enchantment)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiEdit2 />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton
                aria-label="Excluir"
                onClick={() => onDelete(enchantment)}
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
