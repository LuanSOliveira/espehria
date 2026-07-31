'use client';

import { useEffect, useState } from 'react';
import {
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Tooltip,
} from '@mui/material';
import { FiEye, FiPlus, FiSearch } from 'react-icons/fi';
import { FormModal } from '@/shared/components/Modals';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { DefaultText, Label } from '@/shared/components/Texts';
import { TagBadge } from '@/shared/components/TagBadge';
import { useGetEntityList } from '@/hooks/Queries';
import { useEntityMentionViewStore } from '@/store';
import { IEntityReference, ITag } from '@/shared/interfaces';
import { APP_COLORS, APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';

interface EntityReferenceCandidate {
  id: string;
  name: string;
  tags: ITag[];
  level?: number | null;
}

interface EntityReferenceCandidateListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}

export interface EntityReferenceTabConfig {
  label: string;
  entityType: string;
  url: string;
}

const ENTITY_REFERENCE_SELECTION_TABS: EntityReferenceTabConfig[] = [
  { label: 'Treinamentos', entityType: 'training', url: '/trainings' },
  { label: 'Talentos', entityType: 'talent', url: '/talents' },
  {
    label: 'Características',
    entityType: 'characteristic',
    url: '/characteristics',
  },
  { label: 'Técnicas', entityType: 'technique', url: '/techniques' },
  { label: 'Magias', entityType: 'spell', url: '/spells' },
];

export interface EntityReferenceSelectionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  excludeReferences: { entityType: string; id: string }[];
  onSelect: (reference: IEntityReference) => void;
  tabs?: EntityReferenceTabConfig[];
}

export const EntityReferenceSelectionModal = ({
  open,
  onClose,
  title,
  excludeReferences,
  onSelect,
  tabs = ENTITY_REFERENCE_SELECTION_TABS,
}: EntityReferenceSelectionModalProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(1);

  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );

  const activeTab = tabs[activeTabIndex];

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTabIndex(0);
    setNameFilter('');
    setPage(1);
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [activeTabIndex, nameFilter]);

  const { data, isLoading } = useGetEntityList<
    EntityReferenceCandidate,
    EntityReferenceCandidateListFilters
  >({
    url: activeTab.url,
    filters: {
      name: nameFilter || undefined,
      page,
      perPage: APP_DEFAULT_PAGE_SIZE,
    },
    enabled: open,
  });

  const excludedIds = excludeReferences
    .filter((reference) => reference.entityType === activeTab.entityType)
    .map((reference) => reference.id);

  const items = (data?.data ?? []).filter(
    (item) => !excludedIds.includes(item.id),
  );

  return (
    <FormModal open={open} onClose={onClose} title={title} size="wide">
      <div className="flex flex-col gap-4">
        {tabs.length > 1 && (
          <Tabs
            value={activeTabIndex}
            onChange={(_event, newValue: number) => setActiveTabIndex(newValue)}
            sx={{
              borderBottom: `1px solid ${APP_COLORS.gold}`,
              '& .MuiTab-root': { color: APP_COLORS.textBrownDark },
              '& .Mui-selected': { color: `${APP_COLORS.goldDark} !important` },
              '& .MuiTabs-indicator': { backgroundColor: APP_COLORS.goldDark },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.entityType} label={tab.label} />
            ))}
          </Tabs>
        )}

        <DefaultTextInput
          id="entity-reference-selection-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
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
                  <TableCell colSpan={3} sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>Nenhum item encontrado.</DefaultText>
                  </TableCell>
                </TableRow>
              )}

              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
                    <DefaultText>{item.name}</DefaultText>
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
                        onClick={() =>
                          openEntityView(activeTab.entityType, item.id)
                        }
                        sx={{ color: APP_COLORS.textBrownDark }}
                      >
                        <FiEye />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Adicionar">
                      <IconButton
                        aria-label={`Adicionar ${item.name}`}
                        onClick={() =>
                          onSelect({
                            id: item.id,
                            name: item.name,
                            entityType: activeTab.entityType,
                            tags: item.tags,
                            level: item.level,
                          })
                        }
                        sx={{ color: APP_COLORS.textBrownDark }}
                      >
                        <FiPlus />
                      </IconButton>
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
    </FormModal>
  );
};
