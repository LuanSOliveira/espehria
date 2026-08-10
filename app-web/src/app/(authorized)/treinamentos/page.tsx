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
  ITag,
  ITrainingListFilters,
  ITrainingListItem,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedTrainingStore } from '@/store';
import { TrainingsList } from './components/TrainingsList';
import { TrainingCreateForm } from './components/TrainingCreateForm';
import { TrainingsFilterSection } from './components/TrainingsFilterSection';
import { TrainingView } from './components/TrainingView';

export default function TrainingsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [trainingPendingDelete, setTrainingPendingDelete] =
    useState<ITrainingListItem | null>(null);
  const [trainingPendingView, setTrainingPendingView] =
    useState<ITrainingListItem | null>(null);
  const [filters, setFilters] = useState<ITrainingListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedTraining, resetSelectedTraining, setSelectedTraining } =
    useSelectedTrainingStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    ITrainingListItem,
    ITrainingListFilters
  >({
    url: '/trainings',
    filters,
  });

  const deleteTrainingMutation = useDeleteEntity({
    url: `/trainings/${trainingPendingDelete?.id}`,
    invalidateQueryKeys: [['/trainings']],
    onSuccess: () => {
      showToast({
        message: 'Treinamento excluído com sucesso.',
        type: 'success',
      });
      setTrainingPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o treinamento.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedLevel = Number(levelInput.trim());
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      level:
        levelInput.trim() && !Number.isNaN(parsedLevel)
          ? parsedLevel
          : undefined,
      tagIds: selectedTags.length
        ? selectedTags.map((tag) => tag.id)
        : undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setLevelInput('');
    setSelectedTags([]);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedTraining();
    setIsFormModalOpen(true);
  };

  const handleEdit = (training: ITrainingListItem) => {
    setSelectedTraining(training);
    setIsFormModalOpen(true);
  };

  const handleView = (training: ITrainingListItem) => {
    setTrainingPendingView(training);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedTraining();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Treinamentos
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

      <TrainingsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        levelValue={levelInput}
        onLevelChange={setLevelInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <TrainingsList
        trainings={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setTrainingPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedTraining ? 'Editar treinamento' : 'Novo treinamento'}
        size="wide"
      >
        <TrainingCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!trainingPendingView}
        onClose={() => setTrainingPendingView(null)}
        title="Detalhes do Treinamento"
        size="wide"
      >
        {trainingPendingView && (
          <TrainingView trainingId={trainingPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!trainingPendingDelete}
        title="Excluir treinamento"
        message={`Tem certeza que deseja excluir o treinamento "${trainingPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteTrainingMutation.isPending}
        onConfirm={() => deleteTrainingMutation.mutate()}
        onCancel={() => setTrainingPendingDelete(null)}
      />
    </PageContainer>
  );
}
