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
import { IEquipmentListItem } from '@/shared/interfaces';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { EquipmentListItem } from '../EquipmentListItem';

export interface EquipmentListProps {
  equipment: IEquipmentListItem[];
  total: number;
  page: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onView: (item: IEquipmentListItem) => void;
  onEdit: (item: IEquipmentListItem) => void;
  onDelete: (item: IEquipmentListItem) => void;
}

export const EquipmentList = ({
  equipment,
  total,
  page,
  isLoading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: EquipmentListProps) => {
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
          {!isLoading && equipment.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ borderColor: APP_COLORS.gold }}>
                <DefaultText>Nenhum equipamento encontrado.</DefaultText>
              </TableCell>
            </TableRow>
          )}

          {equipment.map((item) => (
            <EquipmentListItem
              key={item.id}
              equipment={item}
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
