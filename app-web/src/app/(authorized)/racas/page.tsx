'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import {
  ConfirmationModal,
  FormModal,
  ViewModal,
} from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import {
  useDeleteEntity,
  useGetEntityList,
  useRaceCategoriesQuery,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  IRaceCategory,
  IRaceListFilters,
  IRaceListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedRaceStore } from '@/store';
import { RacesList } from './components/RacesList';
import { RaceCreateForm } from './components/RaceCreateForm';
import { RacesFilterSection } from './components/RacesFilterSection';
import { RaceView } from './components/RaceView';

export default function RacesPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IRaceCategory | null>(
    null,
  );
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [racePendingDelete, setRacePendingDelete] =
    useState<IRaceListItem | null>(null);
  const [racePendingView, setRacePendingView] = useState<IRaceListItem | null>(
    null,
  );
  const [filters, setFilters] = useState<IRaceListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedRace, resetSelectedRace, setSelectedRace } =
    useSelectedRaceStore();

  const { data: categories } = useRaceCategoriesQuery();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<IRaceListItem, IRaceListFilters>(
    {
      url: '/races',
      filters,
    },
  );

  const deleteRaceMutation = useDeleteEntity({
    url: `/races/${racePendingDelete?.id}`,
    invalidateQueryKeys: [['/races']],
    onSuccess: () => {
      showToast({
        message: 'Raça excluída com sucesso.',
        type: 'success',
      });
      setRacePendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível excluir a raça.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      categoryId: categoryFilter?.id,
      tagIds: selectedTags.length
        ? selectedTags.map((tag) => tag.id)
        : undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setCategoryFilter(null);
    setSelectedTags([]);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedRace();
    setIsFormModalOpen(true);
  };

  const handleEdit = (race: IRaceListItem) => {
    setSelectedRace(race);
    setIsFormModalOpen(true);
  };

  const handleView = (race: IRaceListItem) => {
    setRacePendingView(race);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedRace();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Raças
        </Title>
        {!isGoogleUser && (
          <PrimaryButton
            type="button"
            onClick={handleOpenCreateModal}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Novo
          </PrimaryButton>
        )}
      </div>

      <RacesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        categoryValue={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories ?? []}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <RacesList
        races={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setRacePendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedRace ? 'Editar raça' : 'Nova raça'}
        size="wide"
      >
        <RaceCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!racePendingView}
        onClose={() => setRacePendingView(null)}
        title="Detalhes da Raça"
        size="wide"
      >
        {racePendingView && <RaceView raceId={racePendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!racePendingDelete}
        title="Excluir raça"
        message={`Tem certeza que deseja excluir a raça "${racePendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteRaceMutation.isPending}
        onConfirm={() => deleteRaceMutation.mutate()}
        onCancel={() => setRacePendingDelete(null)}
      />
    </PageContainer>
  );
}
