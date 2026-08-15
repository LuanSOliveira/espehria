'use client';

import { useEffect, useState } from 'react';
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
import { FiCheck, FiEye, FiSearch } from 'react-icons/fi';
import { FormModal, ViewModal } from '@/shared/components/Modals';
import {
  DefaultAutocompleteInput,
  DefaultMultiAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { DefaultText, Label } from '@/shared/components/Texts';
import { TagBadge } from '@/shared/components/TagBadge';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { RaceView } from '@/app/(authorized)/racas/components/RaceView';
import {
  useGetEntityList,
  useRaceCategoriesQuery,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import { IRaceCategory, IRaceListFilters, IRaceListItem, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';

export interface SheetRaceSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (race: IRaceListItem) => void;
  isSelecting?: boolean;
}

export const SheetRaceSelectionModal = ({
  open,
  onClose,
  onSelect,
  isSelecting = false,
}: SheetRaceSelectionModalProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IRaceCategory | null>(
    null,
  );
  const [tagsFilter, setTagsFilter] = useState<ITag[]>([]);
  const [page, setPage] = useState(1);
  const [viewingRaceId, setViewingRaceId] = useState<string | null>(null);

  const { data: categories } = useRaceCategoriesQuery();
  const { tagOptions } = useTagOptionsQuery();

  useEffect(() => {
    if (!open) {
      return;
    }

    setNameFilter('');
    setCategoryFilter(null);
    setTagsFilter([]);
    setPage(1);
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [nameFilter, categoryFilter, tagsFilter]);

  const { data, isLoading } = useGetEntityList<IRaceListItem, IRaceListFilters>({
    url: '/races',
    filters: {
      name: nameFilter || undefined,
      categoryId: categoryFilter?.id,
      tagIds: tagsFilter.length > 0 ? tagsFilter.map((tag) => tag.id) : undefined,
      page,
      perPage: APP_DEFAULT_PAGE_SIZE,
    },
    enabled: open,
  });

  const items = data?.data ?? [];

  return (
    <FormModal open={open} onClose={onClose} title="Selecionar raça" size="wide">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-50 flex-1">
            <DefaultTextInput
              id="sheet-race-selection-name-filter"
              label="Nome"
              placeholder="Buscar por nome"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              icon={<FiSearch />}
            />
          </div>
          <div className="min-w-50 flex-1">
            <DefaultAutocompleteInput<IRaceCategory>
              id="sheet-race-selection-category-filter"
              label="Categoria"
              options={categories ?? []}
              getOptionLabel={(category) => category.name}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Todas as categorias"
            />
          </div>
          <div className="min-w-60 flex-1">
            <DefaultMultiAutocompleteInput<ITag>
              id="sheet-race-selection-tags-filter"
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
                    Categoria
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
                  <TableCell colSpan={5} sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>Nenhuma raça encontrada.</DefaultText>
                  </TableCell>
                </TableRow>
              )}

              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                    <ImageAvatarPreview
                      imageUrl={item.referenceImageUrl}
                      alt={item.name}
                    />
                  </TableCell>
                  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>{item.name}</DefaultText>
                  </TableCell>
                  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>{item.category.name}</DefaultText>
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
                        onClick={() => setViewingRaceId(item.id)}
                        sx={{ color: APP_COLORS.textBrownDark }}
                      >
                        <FiEye />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Selecionar">
                      <span>
                        <IconButton
                          aria-label={`Selecionar ${item.name}`}
                          onClick={() => onSelect(item)}
                          disabled={isSelecting}
                          sx={{ color: APP_COLORS.textBrownDark }}
                        >
                          <FiCheck />
                        </IconButton>
                      </span>
                    </Tooltip>
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

      <ViewModal
        open={!!viewingRaceId}
        onClose={() => setViewingRaceId(null)}
        title="Detalhes da Raça"
        size="wide"
      >
        {viewingRaceId && <RaceView raceId={viewingRaceId} />}
      </ViewModal>
    </FormModal>
  );
};
