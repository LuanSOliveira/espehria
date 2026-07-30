'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal, ViewModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { ISkillListFilters, ISkillListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedSkillStore } from '@/store';
import { SkillsList } from './components/SkillsList';
import { SkillCreateForm } from './components/SkillCreateForm';
import { SkillsFilterSection } from './components/SkillsFilterSection';
import { SkillView } from './components/SkillView';

export default function SkillsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [skillPendingDelete, setSkillPendingDelete] =
    useState<ISkillListItem | null>(null);
  const [skillPendingView, setSkillPendingView] =
    useState<ISkillListItem | null>(null);
  const [filters, setFilters] = useState<ISkillListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedSkill, resetSelectedSkill, setSelectedSkill } =
    useSelectedSkillStore();

  const { data, isLoading } = useGetEntityList<ISkillListItem, ISkillListFilters>({
    url: '/skills',
    filters,
  });

  const deleteSkillMutation = useDeleteEntity({
    url: `/skills/${skillPendingDelete?.id}`,
    invalidateQueryKeys: [['/skills']],
    onSuccess: () => {
      showToast({
        message: 'Perícia excluída com sucesso.',
        type: 'success',
      });
      setSkillPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a perícia.',
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
    resetSelectedSkill();
    setIsFormModalOpen(true);
  };

  const handleEdit = (skill: ISkillListItem) => {
    setSelectedSkill(skill);
    setIsFormModalOpen(true);
  };

  const handleView = (skill: ISkillListItem) => {
    setSkillPendingView(skill);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedSkill();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Perícias
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

      <SkillsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <SkillsList
        skills={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setSkillPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedSkill ? 'Editar perícia' : 'Nova perícia'}
        size="wide"
      >
        <SkillCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!skillPendingView}
        onClose={() => setSkillPendingView(null)}
        title="Detalhes da Perícia"
        size="wide"
      >
        {skillPendingView && <SkillView skillId={skillPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!skillPendingDelete}
        title="Excluir perícia"
        message={`Tem certeza que deseja excluir a perícia "${skillPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteSkillMutation.isPending}
        onConfirm={() => deleteSkillMutation.mutate()}
        onCancel={() => setSkillPendingDelete(null)}
      />
    </PageContainer>
  );
}
