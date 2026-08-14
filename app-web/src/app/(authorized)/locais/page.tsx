'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal, ViewModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import {
  useDeleteEntity,
  useGetEntityList,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  ILocationListFilters,
  ILocationListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedLocationStore } from '@/store';
import { LocationsList } from './components/LocationsList';
import { LocationCreateForm } from './components/LocationCreateForm';
import { LocationsFilterSection } from './components/LocationsFilterSection';
import { LocationView } from './components/LocationView';

export default function LocationsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [locationPendingDelete, setLocationPendingDelete] =
    useState<ILocationListItem | null>(null);
  const [locationPendingView, setLocationPendingView] =
    useState<ILocationListItem | null>(null);
  const [filters, setFilters] = useState<ILocationListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedLocation, resetSelectedLocation, setSelectedLocation } =
    useSelectedLocationStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    ILocationListItem,
    ILocationListFilters
  >({
    url: '/locations',
    filters,
  });

  const deleteLocationMutation = useDeleteEntity({
    url: `/locations/${locationPendingDelete?.id}`,
    invalidateQueryKeys: [['/locations']],
    onSuccess: () => {
      showToast({
        message: 'Local excluído com sucesso.',
        type: 'success',
      });
      setLocationPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o local.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      type: typeInput.trim() || undefined,
      tagIds: selectedTags.length
        ? selectedTags.map((tag) => tag.id)
        : undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setTypeInput('');
    setSelectedTags([]);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedLocation();
    setIsFormModalOpen(true);
  };

  const handleEdit = (location: ILocationListItem) => {
    setSelectedLocation(location);
    setIsFormModalOpen(true);
  };

  const handleView = (location: ILocationListItem) => {
    setLocationPendingView(location);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedLocation();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Locais
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

      <LocationsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        typeValue={typeInput}
        onTypeChange={setTypeInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <LocationsList
        locations={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setLocationPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedLocation ? 'Editar local' : 'Novo local'}
        size="wide"
      >
        <LocationCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!locationPendingView}
        onClose={() => setLocationPendingView(null)}
        title="Detalhes do Local"
        size="wide"
      >
        {locationPendingView && (
          <LocationView locationId={locationPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!locationPendingDelete}
        title="Excluir local"
        message={`Tem certeza que deseja excluir o local "${locationPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteLocationMutation.isPending}
        onConfirm={() => deleteLocationMutation.mutate()}
        onCancel={() => setLocationPendingDelete(null)}
      />
    </PageContainer>
  );
}
