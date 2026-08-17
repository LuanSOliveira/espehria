'use client';

import { useState } from 'react';
import {
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from '@mui/material';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { FormModal } from '@/shared/components/Modals';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { DefaultText, Label } from '@/shared/components/Texts';
import {
  useGetEntityList,
  useWeaponEmbeddedEffectDetailMutation,
} from '@/hooks/Queries';
import {
  EquipmentApplicableType,
  IEnchantmentListItem,
  IEnhancementListItem,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';

interface WeaponEmbeddedEffectCandidateListFilters {
  name?: string;
  type: EquipmentApplicableType;
  page: number;
  perPage: number;
  [key: string]: string | number | boolean | undefined;
}

export interface WeaponEmbeddedEffectPickerModalProps {
  open: boolean;
  onClose: () => void;
  entityLabel: string;
  entityUrl: '/enchantments' | '/enhancements';
  onSelect: (item: { name: string; effect?: string | null }) => void;
}

export const WeaponEmbeddedEffectPickerModal = ({
  open,
  onClose,
  entityLabel,
  entityUrl,
  onSelect,
}: WeaponEmbeddedEffectPickerModalProps) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Selecionar ${entityLabel}`}
      size="wide"
    >
      {open && (
        <WeaponEmbeddedEffectPickerModalBody
          entityLabel={entityLabel}
          entityUrl={entityUrl}
          onSelect={onSelect}
          onClose={onClose}
        />
      )}
    </FormModal>
  );
};

interface WeaponEmbeddedEffectPickerModalBodyProps {
  entityLabel: string;
  entityUrl: '/enchantments' | '/enhancements';
  onSelect: (item: { name: string; effect?: string | null }) => void;
  onClose: () => void;
}

/**
 * Corpo do modal, montado somente enquanto `open` é `true` (ver componente
 * acima). Isso garante que fechar o modal descarte imediatamente o estado
 * local (filtro, página, seleção em andamento) e cancele qualquer efeito de
 * uma busca de detalhe ainda em voo, já que o `useMutation` é desmontado
 * junto — sem precisar de um `useEffect` para resetar estado.
 */
const WeaponEmbeddedEffectPickerModalBody = ({
  entityLabel,
  entityUrl,
  onSelect,
  onClose,
}: WeaponEmbeddedEffectPickerModalBodyProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(1);

  const handleNameFilterChange = (value: string) => {
    setNameFilter(value);
    setPage(1);
  };

  const { data, isLoading } = useGetEntityList<
    IEnchantmentListItem | IEnhancementListItem,
    WeaponEmbeddedEffectCandidateListFilters
  >({
    url: entityUrl,
    filters: {
      name: nameFilter || undefined,
      type: 'weapon',
      page,
      perPage: APP_DEFAULT_PAGE_SIZE,
    },
  });

  const detailMutation = useWeaponEmbeddedEffectDetailMutation({
    entityUrl,
    onSuccess: (detail) => {
      onSelect({ name: detail.name, effect: detail.effect ?? '' });
      onClose();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          `Não foi possível carregar os dados do ${entityLabel.toLowerCase()} selecionado.`,
        type: 'error',
      });
    },
  });

  const items = data?.data ?? [];
  const isSelecting = detailMutation.isPending;
  const selectingId = isSelecting ? detailMutation.variables : null;

  return (
    <div className="flex flex-col gap-4">
      <DefaultTextInput
        id="weapon-embedded-effect-picker-name-filter"
        label="Nome"
        placeholder="Buscar por nome"
        value={nameFilter}
        onChange={(event) => handleNameFilterChange(event.target.value)}
        icon={<FiSearch />}
      />

      <TableContainer>
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
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} sx={{ borderColor: APP_COLORS.gold }}>
                  <DefaultText>
                    {`Nenhum ${entityLabel.toLowerCase()} encontrado.`}
                  </DefaultText>
                </TableCell>
              </TableRow>
            )}

            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                  <DefaultText>{item.name}</DefaultText>
                </TableCell>
                <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
                  {isSelecting && selectingId === item.id ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Tooltip title="Selecionar">
                      <span>
                        <IconButton
                          aria-label={`Selecionar ${item.name}`}
                          onClick={() => detailMutation.mutate(item.id)}
                          disabled={isSelecting}
                          sx={{ color: APP_COLORS.textBrownDark }}
                        >
                          <FiPlus />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page - 1}
          rowsPerPage={APP_DEFAULT_PAGE_SIZE}
          rowsPerPageOptions={[APP_DEFAULT_PAGE_SIZE]}
          onPageChange={(_event, newPage) => setPage(newPage + 1)}
          sx={{
            color: APP_COLORS.textBrownDark,
            borderTop: `1px solid ${APP_COLORS.gold}`,
          }}
        />
      </TableContainer>
    </div>
  );
};
