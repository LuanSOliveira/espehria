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
import { ITalentListItem } from '@/shared/interfaces';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { TalentsListItem } from '../TalentsListItem';

export interface TalentsListProps {
  talents: ITalentListItem[];
  total: number;
  page: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onView: (talent: ITalentListItem) => void;
  onEdit: (talent: ITalentListItem) => void;
  onDelete: (talent: ITalentListItem) => void;
}

export const TalentsList = ({
  talents,
  total,
  page,
  isLoading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: TalentsListProps) => {
  return (
    <TableContainer className="mt-6">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ borderColor: APP_COLORS.gold }}>
              <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                Nome
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
          {!isLoading && talents.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} sx={{ borderColor: APP_COLORS.gold }}>
                <DefaultText>Nenhum talento encontrado.</DefaultText>
              </TableCell>
            </TableRow>
          )}

          {talents.map((talent) => (
            <TalentsListItem
              key={talent.id}
              talent={talent}
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
