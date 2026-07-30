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
import { IAmmunitionListItem } from '@/shared/interfaces';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { AmmunitionListItem } from '../AmmunitionListItem';

export interface AmmunitionListProps {
  ammunition: IAmmunitionListItem[];
  total: number;
  page: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onView: (item: IAmmunitionListItem) => void;
  onEdit: (item: IAmmunitionListItem) => void;
  onDelete: (item: IAmmunitionListItem) => void;
}

export const AmmunitionList = ({
  ammunition,
  total,
  page,
  isLoading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: AmmunitionListProps) => {
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
          {!isLoading && ammunition.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ borderColor: APP_COLORS.gold }}>
                <DefaultText>Nenhuma munição encontrada.</DefaultText>
              </TableCell>
            </TableRow>
          )}

          {ammunition.map((item) => (
            <AmmunitionListItem
              key={item.id}
              ammunition={item}
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
