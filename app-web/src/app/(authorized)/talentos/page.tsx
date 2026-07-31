'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal, ViewModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { ITalentListFilters, ITalentListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedTalentStore } from '@/store';
import { TalentsList } from './components/TalentsList';
import { TalentCreateForm } from './components/TalentCreateForm';
import { TalentsFilterSection } from './components/TalentsFilterSection';
import { TalentView } from './components/TalentView';

export default function TalentsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [talentPendingDelete, setTalentPendingDelete] =
    useState<ITalentListItem | null>(null);
  const [talentPendingView, setTalentPendingView] =
    useState<ITalentListItem | null>(null);
  const [filters, setFilters] = useState<ITalentListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedTalent, resetSelectedTalent, setSelectedTalent } =
    useSelectedTalentStore();

  const { data, isLoading } = useGetEntityList<
    ITalentListItem,
    ITalentListFilters
  >({
    url: '/talents',
    filters,
  });

  const deleteTalentMutation = useDeleteEntity({
    url: `/talents/${talentPendingDelete?.id}`,
    invalidateQueryKeys: [['/talents']],
    onSuccess: () => {
      showToast({
        message: 'Talento excluído com sucesso.',
        type: 'success',
      });
      setTalentPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o talento.',
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
    resetSelectedTalent();
    setIsFormModalOpen(true);
  };

  const handleEdit = (talent: ITalentListItem) => {
    setSelectedTalent(talent);
    setIsFormModalOpen(true);
  };

  const handleView = (talent: ITalentListItem) => {
    setTalentPendingView(talent);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedTalent();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Talentos
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

      <TalentsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <TalentsList
        talents={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setTalentPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedTalent ? 'Editar talento' : 'Novo talento'}
        size="wide"
      >
        <TalentCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!talentPendingView}
        onClose={() => setTalentPendingView(null)}
        title="Detalhes do Talento"
        size="wide"
      >
        {talentPendingView && <TalentView talentId={talentPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!talentPendingDelete}
        title="Excluir talento"
        message={`Tem certeza que deseja excluir o talento "${talentPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteTalentMutation.isPending}
        onConfirm={() => deleteTalentMutation.mutate()}
        onCancel={() => setTalentPendingDelete(null)}
      />
    </PageContainer>
  );
}
