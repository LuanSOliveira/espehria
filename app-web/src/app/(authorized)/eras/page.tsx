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
  useTagOptionsQuery,
} from '@/hooks/Queries';
import { IEraListFilters, IEraListItem, ITag } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedEraStore } from '@/store';
import { ErasList } from './components/ErasList';
import { EraCreateForm } from './components/EraCreateForm';
import { ErasFilterSection } from './components/ErasFilterSection';
import { EraView } from './components/EraView';

export default function ErasPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [eraPendingDelete, setEraPendingDelete] =
    useState<IEraListItem | null>(null);
  const [eraPendingView, setEraPendingView] = useState<IEraListItem | null>(
    null,
  );
  const [filters, setFilters] = useState<IEraListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedEra, resetSelectedEra, setSelectedEra } =
    useSelectedEraStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<IEraListItem, IEraListFilters>({
    url: '/eras',
    filters,
  });

  const deleteEraMutation = useDeleteEntity({
    url: `/eras/${eraPendingDelete?.id}`,
    invalidateQueryKeys: [['/eras'], ['/eras/all']],
    onSuccess: () => {
      showToast({
        message: 'Era excluída com sucesso.',
        type: 'success',
      });
      setEraPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível excluir a era.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      tagIds: selectedTags.length
        ? selectedTags.map((tag) => tag.id)
        : undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setSelectedTags([]);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedEra();
    setIsFormModalOpen(true);
  };

  const handleEdit = (era: IEraListItem) => {
    setSelectedEra(era);
    setIsFormModalOpen(true);
  };

  const handleView = (era: IEraListItem) => {
    setEraPendingView(era);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedEra();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Eras
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

      <ErasFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <ErasList
        eras={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setEraPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedEra ? 'Editar era' : 'Nova era'}
        size="wide"
      >
        <EraCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!eraPendingView}
        onClose={() => setEraPendingView(null)}
        title="Detalhes da Era"
        size="wide"
      >
        {eraPendingView && <EraView eraId={eraPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!eraPendingDelete}
        title="Excluir era"
        message={`Tem certeza que deseja excluir a era "${eraPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteEraMutation.isPending}
        onConfirm={() => deleteEraMutation.mutate()}
        onCancel={() => setEraPendingDelete(null)}
      />
    </PageContainer>
  );
}
