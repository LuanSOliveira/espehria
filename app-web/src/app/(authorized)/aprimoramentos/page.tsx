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
import { IEnhancementListFilters, IEnhancementListItem } from '@/shared/interfaces';
import {
  APP_DEFAULT_PAGE_SIZE,
  EquipmentApplicableTypeOption,
} from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedEnhancementStore } from '@/store';
import { EnhancementsList } from './components/EnhancementsList';
import { EnhancementCreateForm } from './components/EnhancementCreateForm';
import { EnhancementsFilterSection } from './components/EnhancementsFilterSection';
import { EnhancementView } from './components/EnhancementView';

export default function EnhancementsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [typeInput, setTypeInput] = useState<EquipmentApplicableTypeOption | null>(
    null,
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [enhancementPendingDelete, setEnhancementPendingDelete] =
    useState<IEnhancementListItem | null>(null);
  const [enhancementPendingView, setEnhancementPendingView] =
    useState<IEnhancementListItem | null>(null);
  const [filters, setFilters] = useState<IEnhancementListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const {
    selectedEnhancement,
    resetSelectedEnhancement,
    setSelectedEnhancement,
  } = useSelectedEnhancementStore();

  const { data, isLoading } = useGetEntityList<
    IEnhancementListItem,
    IEnhancementListFilters
  >({
    url: '/enhancements',
    filters,
  });

  const deleteEnhancementMutation = useDeleteEntity({
    url: `/enhancements/${enhancementPendingDelete?.id}`,
    invalidateQueryKeys: [['/enhancements']],
    onSuccess: () => {
      showToast({
        message: 'Aprimoramento excluído com sucesso.',
        type: 'success',
      });
      setEnhancementPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o aprimoramento.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      type: typeInput?.value ?? undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setNameInput('');
    setTypeInput(null);
    setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedEnhancement();
    setIsFormModalOpen(true);
  };

  const handleEdit = (enhancement: IEnhancementListItem) => {
    setSelectedEnhancement(enhancement);
    setIsFormModalOpen(true);
  };

  const handleView = (enhancement: IEnhancementListItem) => {
    setEnhancementPendingView(enhancement);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedEnhancement();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Aprimoramentos
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

      <EnhancementsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        typeValue={typeInput}
        onTypeChange={setTypeInput}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <EnhancementsList
        enhancements={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setEnhancementPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={
          selectedEnhancement ? 'Editar aprimoramento' : 'Novo aprimoramento'
        }
        size="wide"
      >
        <EnhancementCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!enhancementPendingView}
        onClose={() => setEnhancementPendingView(null)}
        title="Detalhes do Aprimoramento"
        size="wide"
      >
        {enhancementPendingView && (
          <EnhancementView enhancementId={enhancementPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!enhancementPendingDelete}
        title="Excluir aprimoramento"
        message={`Tem certeza que deseja excluir o aprimoramento "${enhancementPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteEnhancementMutation.isPending}
        onConfirm={() => deleteEnhancementMutation.mutate()}
        onCancel={() => setEnhancementPendingDelete(null)}
      />
    </PageContainer>
  );
}
