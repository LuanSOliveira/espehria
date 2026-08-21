'use client';

import { SubmitEvent, useEffect, useState } from 'react';
import {
  Dialog,
  IconButton as MuiIconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { FiCheck, FiX } from 'react-icons/fi';
import { Card } from '@/shared/components/Containers';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { TagBadge } from '@/shared/components/TagBadge';
import { useGetEntityById, useGetEntityList, useTagOptionsQuery } from '@/hooks/Queries';
import {
  IAccessory,
  IAccessoryListFilters,
  IAccessoryListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { formatPriceWithCurrency } from '@/shared/util';
import { AccessoriesFilterSection } from '@/app/(authorized)/acessorios/components/AccessoriesFilterSection';

export interface SheetAccessoryCatalogPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (accessory: IAccessory) => void;
}

/**
 * Modal de seleção de item existente do catálogo de Acessórios — mesmo
 * espírito de `SheetWeaponCatalogPickerModal`.
 */
export const SheetAccessoryCatalogPickerModal = ({
  open,
  onClose,
  onSelect,
}: SheetAccessoryCatalogPickerModalProps) => {
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [filters, setFilters] = useState<IAccessoryListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    IAccessoryListItem,
    IAccessoryListFilters
  >({
    url: '/accessories',
    filters,
    enabled: open,
  });

  const { data: accessoryDetail } = useGetEntityById<IAccessory>({
    url: `/accessories/${selectedId}`,
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (selectedId && accessoryDetail) {
      onSelect(accessoryDetail);
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage à chegada do detalhe após clique em "Selecionar"
  }, [selectedId, accessoryDetail]);

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setSelectedTags([]);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{ paper: { className: 'bg-transparent shadow-none m-4' } }}
    >
      <Card sizeClassName="w-[min(1152px,92vw)]">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-3 right-3 cursor-pointer text-gold-dark hover:text-gold"
          style={{ fontSize: 20, lineHeight: 0 }}
        >
          <FiX />
        </button>

        <Title component="h2" sx={{ marginBottom: '12px' }}>
          Selecionar Acessório do Catálogo
        </Title>

        <AccessoriesFilterSection
          nameValue={nameInput}
          onNameChange={setNameInput}
          tagsValue={selectedTags}
          onTagsChange={setSelectedTags}
          tagOptions={tagOptions}
          onSubmit={handleSearch}
          onClear={handleClear}
        />

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
                <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                  <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                    Preço
                  </Label>
                </TableCell>
                <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
                  <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
                    Ação
                  </Label>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!isLoading && (data?.data.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>Nenhum acessório encontrado.</DefaultText>
                  </TableCell>
                </TableRow>
              )}

              {(data?.data ?? []).map((accessory) => (
                <TableRow key={accessory.id}>
                  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                    <ImageAvatarPreview
                      imageUrl={accessory.referenceImage}
                      alt={accessory.name}
                    />
                  </TableCell>
                  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>{accessory.name}</DefaultText>
                  </TableCell>
                  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                    <div className="flex flex-wrap items-center gap-1">
                      {accessory.tags.map((tag) => (
                        <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>
                      {formatPriceWithCurrency(accessory.price, accessory.currency)}
                    </DefaultText>
                  </TableCell>
                  <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
                    <MuiIconButton
                      aria-label={`Selecionar ${accessory.name}`}
                      onClick={() => setSelectedId(accessory.id)}
                      sx={{ color: APP_COLORS.textBrownDark }}
                    >
                      <FiCheck />
                    </MuiIconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={data?.total ?? 0}
            page={(filters.page ?? 1) - 1}
            rowsPerPage={APP_DEFAULT_PAGE_SIZE}
            rowsPerPageOptions={[APP_DEFAULT_PAGE_SIZE]}
            onPageChange={(_event, newPage) =>
              setFilters((current) => ({ ...current, page: newPage + 1 }))
            }
            sx={{ color: APP_COLORS.textBrownDark, borderTop: `1px solid ${APP_COLORS.gold}` }}
          />
        </TableContainer>
      </Card>
    </Dialog>
  );
};
