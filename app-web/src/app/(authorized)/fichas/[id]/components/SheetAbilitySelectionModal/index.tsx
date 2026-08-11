'use client';

import { useEffect, useMemo, useState } from 'react';
import {
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
import { FiAlertTriangle, FiEye, FiLock, FiPlus, FiSearch } from 'react-icons/fi';
import { FormModal } from '@/shared/components/Modals';
import {
  DefaultMultiAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { DefaultText, Label } from '@/shared/components/Texts';
import { TagBadge } from '@/shared/components/TagBadge';
import {
  useCheckSheetAbilityRequirementsQuery,
  useGetEntityList,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import { useEntityMentionViewStore } from '@/store';
import { ISheetAbilityBucketType, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';

interface SheetAbilityCandidate {
  id: string;
  name: string;
  level: number;
  tags: ITag[];
}

interface SheetAbilityCandidateListFilters {
  name?: string;
  level?: number;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}

export interface SheetAbilitySelectionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entityType: ISheetAbilityBucketType;
  /** `/characteristics` | `/trainings` | `/talents`. */
  url: string;
  sheetId: string;
  onSelect: (item: { id: string; name: string }) => void;
  isSelecting?: boolean;
}

/**
 * Modal de seleção dedicado à ficha (spec, decisão de investigação nº 9 /
 * requisito de frontend nº 4) — não estende `EntityReferenceSelectionModal`,
 * que é genérico para 5 tipos de entidade fora do contexto de ficha e só
 * suporta filtro por nome. Este modal recebe um único `entityType` por
 * abertura e reaproveita os filtros nome/level/tags já usados nas páginas de
 * listagem de Características/Treinamentos/Talentos.
 *
 * Desvio confirmado contra o backend real: a listagem paginada
 * (`/characteristics` | `/trainings` | `/talents`) não retorna
 * `requirementsMet` por item — esse status vem de um endpoint dedicado,
 * `POST /sheets/:id/abilities/requirement-checks`, chamado aqui em lote para
 * os itens da página atual (`alreadyPresent`/`requirementsMet`).
 */
export const SheetAbilitySelectionModal = ({
  open,
  onClose,
  title,
  entityType,
  url,
  sheetId,
  onSelect,
  isSelecting = false,
}: SheetAbilitySelectionModalProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState<ITag[]>([]);
  const [page, setPage] = useState(1);

  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );
  const { tagOptions } = useTagOptionsQuery();

  useEffect(() => {
    if (!open) {
      return;
    }

    setNameFilter('');
    setLevelFilter('');
    setTagsFilter([]);
    setPage(1);
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [nameFilter, levelFilter, tagsFilter]);

  const { data, isLoading } = useGetEntityList<
    SheetAbilityCandidate,
    SheetAbilityCandidateListFilters
  >({
    url,
    filters: {
      name: nameFilter || undefined,
      level: levelFilter ? Number(levelFilter) : undefined,
      tagIds: tagsFilter.length > 0 ? tagsFilter.map((tag) => tag.id) : undefined,
      page,
      perPage: APP_DEFAULT_PAGE_SIZE,
    },
    enabled: open,
  });

  const items = data?.data ?? [];
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  const { data: requirementChecks } = useCheckSheetAbilityRequirementsQuery({
    sheetId,
    entityType,
    ids: itemIds,
    enabled: open && itemIds.length > 0,
  });

  const checksById = useMemo(
    () => new Map((requirementChecks ?? []).map((check) => [check.id, check])),
    [requirementChecks],
  );

  return (
    <FormModal open={open} onClose={onClose} title={title} size="wide">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-50 flex-1">
            <DefaultTextInput
              id="sheet-ability-selection-name-filter"
              label="Nome"
              placeholder="Buscar por nome"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              icon={<FiSearch />}
            />
          </div>
          <div className="min-w-32 flex-1">
            <DefaultTextInput
              id="sheet-ability-selection-level-filter"
              label="Level"
              placeholder="Buscar por level"
              type="number"
              slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            />
          </div>
          <div className="min-w-60 flex-1">
            <DefaultMultiAutocompleteInput<ITag>
              id="sheet-ability-selection-tags-filter"
              label="Tags"
              options={tagOptions}
              getOptionLabel={formatTagLabel}
              getOptionValue={(tag) => tag.id}
              getOptionColor={(tag) => tag.color}
              value={tagsFilter}
              onChange={setTagsFilter}
              placeholder="Selecione as tags"
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                  <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                    Nome
                  </Label>
                </TableCell>
                <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                  <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                    Level
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
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>Nenhum item encontrado.</DefaultText>
                  </TableCell>
                </TableRow>
              )}

              {items.map((item) => {
                const check = checksById.get(item.id);
                const alreadyPresent = check?.alreadyPresent ?? false;
                const requirementsMet = check?.requirementsMet ?? true;
                const isAddDisabled = alreadyPresent || !requirementsMet;
                const addTooltip = alreadyPresent
                  ? 'Já está na ficha'
                  : !requirementsMet
                    ? 'Requisitos não atendidos'
                    : 'Adicionar';

                return (
                  <TableRow key={item.id}>
                    <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                      <div className="flex items-center gap-2">
                        <DefaultText>{item.name}</DefaultText>
                        {!alreadyPresent && !requirementsMet && (
                          <Tooltip title="Requisitos não atendidos">
                            <span className="flex items-center">
                              <FiAlertTriangle
                                style={{ fontSize: 16, color: APP_COLORS.goldSoft }}
                              />
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                      <DefaultText>{item.level}</DefaultText>
                    </TableCell>
                    <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                      <div className="flex flex-wrap items-center gap-1">
                        {item.tags.map((tag) => (
                          <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
                      <Tooltip title="Visualizar">
                        <IconButton
                          aria-label={`Visualizar ${item.name}`}
                          onClick={() => openEntityView(entityType, item.id)}
                          sx={{ color: APP_COLORS.textBrownDark }}
                        >
                          <FiEye />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={addTooltip}>
                        <span>
                          <IconButton
                            aria-label={`Adicionar ${item.name}`}
                            onClick={() => onSelect({ id: item.id, name: item.name })}
                            disabled={isAddDisabled || isSelecting}
                            sx={{ color: APP_COLORS.textBrownDark }}
                          >
                            {alreadyPresent ? <FiLock /> : <FiPlus />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
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
    </FormModal>
  );
};
