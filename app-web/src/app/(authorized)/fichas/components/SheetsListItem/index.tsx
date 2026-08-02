import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { ISheetListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';

export interface SheetsListItemProps {
  sheet: ISheetListItem;
  onDelete: (sheet: ISheetListItem) => void;
}

export const SheetsListItem = ({ sheet, onDelete }: SheetsListItemProps) => {
  const router = useRouter();

  return (
    <TableRow
      sx={{
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
      }}
    >
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <ImageAvatarPreview imageUrl={sheet.referenceImage} alt={sheet.name} />
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{sheet.name}</DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{sheet.campaign?.name ?? '-'}</DefaultText>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Abrir ficha">
          <IconButton
            aria-label="Abrir ficha"
            onClick={() => router.push(APP_ROUTES.private.sheetDetails(sheet.id))}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEye />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            aria-label="Excluir"
            onClick={() => onDelete(sheet)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiTrash2 />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
