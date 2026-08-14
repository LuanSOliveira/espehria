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
  IConditionListFilters,
  IConditionListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedConditionStore } from '@/store';
import { ConditionsList } from './components/ConditionsList';
import { ConditionCreateForm } from './components/ConditionCreateForm';
import { ConditionsFilterSection } from './components/ConditionsFilterSection';
import { ConditionView } from './components/ConditionView';

export default function ConditionsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [conditionPendingDelete, setConditionPendingDelete] =
    useState<IConditionListItem | null>(null);
  const [conditionPendingView, setConditionPendingView] =
    useState<IConditionListItem | null>(null);
  const [filters, setFilters] = useState<IConditionListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedCondition, resetSelectedCondition, setSelectedCondition } =
    useSelectedConditionStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    IConditionListItem,
    IConditionListFilters
  >({
    url: '/conditions',
    filters,
  });

  const deleteConditionMutation = useDeleteEntity({
    url: `/conditions/${conditionPendingDelete?.id}`,
    invalidateQueryKeys: [['/conditions']],
    onSuccess: () => {
      showToast({
        message: 'Condição excluída com sucesso.',
        type: 'success',
      });
      setConditionPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a condição.',
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
    resetSelectedCondition();
    setIsFormModalOpen(true);
  };

  const handleEdit = (condition: IConditionListItem) => {
    setSelectedCondition(condition);
    setIsFormModalOpen(true);
  };

  const handleView = (condition: IConditionListItem) => {
    setConditionPendingView(condition);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedCondition();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Condições
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

      <ConditionsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <ConditionsList
        conditions={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setConditionPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedCondition ? 'Editar condição' : 'Nova condição'}
        size="wide"
      >
        <ConditionCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!conditionPendingView}
        onClose={() => setConditionPendingView(null)}
        title="Detalhes da Condição"
        size="wide"
      >
        {conditionPendingView && (
          <ConditionView conditionId={conditionPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!conditionPendingDelete}
        title="Excluir condição"
        message={`Tem certeza que deseja excluir a condição "${conditionPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteConditionMutation.isPending}
        onConfirm={() => deleteConditionMutation.mutate()}
        onCancel={() => setConditionPendingDelete(null)}
      />
    </PageContainer>
  );
}
