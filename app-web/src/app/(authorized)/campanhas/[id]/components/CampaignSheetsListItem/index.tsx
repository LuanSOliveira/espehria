import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FiTrash2 } from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { ICampaignSheetListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface CampaignSheetsListItemProps {
  sheet: ICampaignSheetListItem;
  onUnassign: (sheet: ICampaignSheetListItem) => void;
}

export const CampaignSheetsListItem = ({
  sheet,
  onUnassign,
}: CampaignSheetsListItemProps) => {
  const isGoogleUser = useIsGoogleUser();

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
        <DefaultText>{sheet.createdBy.name}</DefaultText>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        {!isGoogleUser && (
          <Tooltip title="Desvincular">
            <IconButton
              aria-label="Desvincular"
              onClick={() => onUnassign(sheet)}
              sx={{ color: APP_COLORS.textBrownDark }}
            >
              <FiTrash2 />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
};
