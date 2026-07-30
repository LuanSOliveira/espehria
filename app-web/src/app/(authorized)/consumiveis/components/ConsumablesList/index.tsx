import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { DefaultText, Label } from '@/shared/components/Texts';
import { IConsumableListItem } from '@/shared/interfaces';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { ConsumablesListItem } from '../ConsumablesListItem';

export interface ConsumablesListProps {
  consumables: IConsumableListItem[];
  total: number;
  page: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onView: (item: IConsumableListItem) => void;
  onEdit: (item: IConsumableListItem) => void;
  onDelete: (item: IConsumableListItem) => void;
}

export const ConsumablesList = ({
  consumables,
  total,
  page,
  isLoading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: ConsumablesListProps) => {
  return (
    <TableContainer className="mt-6">
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
                Tags
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
          {!isLoading && consumables.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ borderColor: APP_COLORS.gold }}>
                <DefaultText>Nenhum consumível encontrado.</DefaultText>
              </TableCell>
            </TableRow>
          )}

          {consumables.map((item) => (
            <ConsumablesListItem
              key={item.id}
              consumable={item}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={APP_DEFAULT_PAGE_SIZE}
        rowsPerPageOptions={[APP_DEFAULT_PAGE_SIZE]}
        onPageChange={(_event, newPage) => onPageChange(newPage + 1)}
        sx={{
          color: APP_COLORS.textBrownDark,
          borderTop: `1px solid ${APP_COLORS.gold}`,
        }}
      />
    </TableContainer>
  );
};
