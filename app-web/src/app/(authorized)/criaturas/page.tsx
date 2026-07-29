'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal, ViewModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import {
  useCreatureCategoriesQuery,
  useDeleteEntity,
  useGetEntityList,
} from '@/hooks/Queries';
import {
  ICreatureCategory,
  ICreatureListFilters,
  ICreatureListItem,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedCreatureStore } from '@/store';
import { CreaturesList } from './components/CreaturesList';
import { CreatureCreateForm } from './components/CreatureCreateForm';
import { CreaturesFilterSection } from './components/CreaturesFilterSection';
import { CreatureView } from './components/CreatureView';

export default function CreaturesPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState<ICreatureCategory | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [creaturePendingDelete, setCreaturePendingDelete] =
    useState<ICreatureListItem | null>(null);
  const [creaturePendingView, setCreaturePendingView] =
    useState<ICreatureListItem | null>(null);
  const [filters, setFilters] = useState<ICreatureListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedCreature, resetSelectedCreature, setSelectedCreature } =
    useSelectedCreatureStore();

  const { data: categories } = useCreatureCategoriesQuery();

  const { data, isLoading } = useGetEntityList<
    ICreatureListItem,
    ICreatureListFilters
  >({
    url: '/creatures',
    filters,
  });

  const deleteCreatureMutation = useDeleteEntity({
    url: `/creatures/${creaturePendingDelete?.id}`,
    invalidateQueryKeys: [['/creatures']],
    onSuccess: () => {
      showToast({
        message: 'Criatura excluída com sucesso.',
        type: 'success',
      });
      setCreaturePendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a criatura.',
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
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedCreature();
    setIsFormModalOpen(true);
  };

  const handleEdit = (creature: ICreatureListItem) => {
    setSelectedCreature(creature);
    setIsFormModalOpen(true);
  };

  const handleView = (creature: ICreatureListItem) => {
    setCreaturePendingView(creature);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedCreature();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Criaturas
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

      <CreaturesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        categoryValue={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories ?? []}
        onSubmit={handleSearch}
      />

      <CreaturesList
        creatures={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setCreaturePendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedCreature ? 'Editar criatura' : 'Nova criatura'}
        size="wide"
      >
        <CreatureCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!creaturePendingView}
        onClose={() => setCreaturePendingView(null)}
        title="Detalhes da Criatura"
        size="wide"
      >
        {creaturePendingView && (
          <CreatureView creatureId={creaturePendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!creaturePendingDelete}
        title="Excluir criatura"
        message={`Tem certeza que deseja excluir a criatura "${creaturePendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteCreatureMutation.isPending}
        onConfirm={() => deleteCreatureMutation.mutate()}
        onCancel={() => setCreaturePendingDelete(null)}
      />
    </PageContainer>
  );
}
