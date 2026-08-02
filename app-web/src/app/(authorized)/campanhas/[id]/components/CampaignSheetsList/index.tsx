import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DefaultText, Label } from '@/shared/components/Texts';
import { ICampaignSheetListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import { CampaignSheetsListItem } from '../CampaignSheetsListItem';

export interface CampaignSheetsListProps {
  sheets: ICampaignSheetListItem[];
  isLoading: boolean;
  isError?: boolean;
  onUnassign: (sheet: ICampaignSheetListItem) => void;
}

export const CampaignSheetsList = ({
  sheets,
  isLoading,
  isError,
  onUnassign,
}: CampaignSheetsListProps) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ borderColor: APP_COLORS.gold }}>
              <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                Imagem
              </Label>
            </TableCell>
            <TableCell sx={{ borderColor: APP_COLORS.gold }}>
              <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                Nome
              </Label>
            </TableCell>
            <TableCell sx={{ borderColor: APP_COLORS.gold }}>
              <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                Jogador
              </Label>
            </TableCell>
            <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
              <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                Ações
              </Label>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!isLoading && isError && (
            <TableRow>
              <TableCell colSpan={4} sx={{ borderColor: APP_COLORS.gold }}>
                <DefaultText>
                  Não foi possível carregar as fichas desta campanha.
                </DefaultText>
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && sheets.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ borderColor: APP_COLORS.gold }}>
                <DefaultText>Nenhuma ficha vinculada a esta campanha.</DefaultText>
              </TableCell>
            </TableRow>
          )}

          {!isError &&
            sheets.map((sheet) => (
              <CampaignSheetsListItem
                key={sheet.id}
                sheet={sheet}
                onUnassign={onUnassign}
              />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
