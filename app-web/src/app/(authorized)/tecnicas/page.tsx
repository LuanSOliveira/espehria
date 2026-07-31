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
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { ITechniqueListFilters, ITechniqueListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedTechniqueStore } from '@/store';
import { TechniquesList } from './components/TechniquesList';
import { TechniqueCreateForm } from './components/TechniqueCreateForm';
import { TechniquesFilterSection } from './components/TechniquesFilterSection';
import { TechniqueView } from './components/TechniqueView';

export default function TechniquesPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [techniquePendingDelete, setTechniquePendingDelete] =
    useState<ITechniqueListItem | null>(null);
  const [techniquePendingView, setTechniquePendingView] =
    useState<ITechniqueListItem | null>(null);
  const [filters, setFilters] = useState<ITechniqueListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedTechnique, resetSelectedTechnique, setSelectedTechnique } =
    useSelectedTechniqueStore();

  const { data, isLoading } = useGetEntityList<
    ITechniqueListItem,
    ITechniqueListFilters
  >({
    url: '/techniques',
    filters,
  });

  const deleteTechniqueMutation = useDeleteEntity({
    url: `/techniques/${techniquePendingDelete?.id}`,
    invalidateQueryKeys: [['/techniques']],
    onSuccess: () => {
      showToast({
        message: 'Técnica excluída com sucesso.',
        type: 'success',
      });
      setTechniquePendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a técnica.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedTechnique();
    setIsFormModalOpen(true);
  };

  const handleEdit = (technique: ITechniqueListItem) => {
    setSelectedTechnique(technique);
    setIsFormModalOpen(true);
  };

  const handleView = (technique: ITechniqueListItem) => {
    setTechniquePendingView(technique);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedTechnique();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Técnicas
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

      <TechniquesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <TechniquesList
        techniques={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setTechniquePendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedTechnique ? 'Editar técnica' : 'Nova técnica'}
        size="wide"
      >
        <TechniqueCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!techniquePendingView}
        onClose={() => setTechniquePendingView(null)}
        title="Detalhes da Técnica"
        size="wide"
      >
        {techniquePendingView && (
          <TechniqueView techniqueId={techniquePendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!techniquePendingDelete}
        title="Excluir técnica"
        message={`Tem certeza que deseja excluir a técnica "${techniquePendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteTechniqueMutation.isPending}
        onConfirm={() => deleteTechniqueMutation.mutate()}
        onCancel={() => setTechniquePendingDelete(null)}
      />
    </PageContainer>
  );
}
