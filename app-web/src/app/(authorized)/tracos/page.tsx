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
import {
  ITag,
  ITraitListFilters,
  ITraitListItem,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedTraitStore } from '@/store';
import { TraitsList } from './components/TraitsList';
import { TraitCreateForm } from './components/TraitCreateForm';
import { TraitsFilterSection } from './components/TraitsFilterSection';
import { TraitView } from './components/TraitView';

export default function TraitsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [traitPendingDelete, setTraitPendingDelete] =
    useState<ITraitListItem | null>(null);
  const [traitPendingView, setTraitPendingView] =
    useState<ITraitListItem | null>(null);
  const [filters, setFilters] = useState<ITraitListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedTrait, resetSelectedTrait, setSelectedTrait } =
    useSelectedTraitStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    ITraitListItem,
    ITraitListFilters
  >({
    url: '/traits',
    filters,
  });

  const deleteTraitMutation = useDeleteEntity({
    url: `/traits/${traitPendingDelete?.id}`,
    invalidateQueryKeys: [['/traits']],
    onSuccess: () => {
      showToast({
        message: 'Traço excluído com sucesso.',
        type: 'success',
      });
      setTraitPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível excluir o traço.',
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
    resetSelectedTrait();
    setIsFormModalOpen(true);
  };

  const handleEdit = (trait: ITraitListItem) => {
    setSelectedTrait(trait);
    setIsFormModalOpen(true);
  };

  const handleView = (trait: ITraitListItem) => {
    setTraitPendingView(trait);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedTrait();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Traços
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

      <TraitsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <TraitsList
        traits={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setTraitPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedTrait ? 'Editar traço' : 'Novo traço'}
        size="wide"
      >
        <TraitCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!traitPendingView}
        onClose={() => setTraitPendingView(null)}
        title="Detalhes do Traço"
        size="wide"
      >
        {traitPendingView && <TraitView traitId={traitPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!traitPendingDelete}
        title="Excluir traço"
        message={`Tem certeza que deseja excluir o traço "${traitPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteTraitMutation.isPending}
        onConfirm={() => deleteTraitMutation.mutate()}
        onCancel={() => setTraitPendingDelete(null)}
      />
    </PageContainer>
  );
}
