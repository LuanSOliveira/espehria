'use client';

import { SubmitEvent, useState } from 'react';

import { ConfirmationModal, FormModal, ViewModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import {
  IPlannedSessionListFilters,
  IPlannedSessionListItem,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedPlannedSessionStore } from '@/store';
import { PlannedSessionsList } from '../PlannedSessionsList';
import { PlannedSessionsFilterSection } from '../PlannedSessionsFilterSection';
import { PlannedSessionCreateForm } from '../PlannedSessionCreateForm';
import { PlannedSessionView } from '../PlannedSessionView';

export interface PlannedSessionsSectionProps {
  campaignId: string;
}

export const PlannedSessionsSection = ({
  campaignId,
}: PlannedSessionsSectionProps) => {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [plannedSessionPendingDelete, setPlannedSessionPendingDelete] =
    useState<IPlannedSessionListItem | null>(null);
  const [plannedSessionPendingView, setPlannedSessionPendingView] =
    useState<IPlannedSessionListItem | null>(null);
  const [filters, setFilters] = useState<IPlannedSessionListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const {
    selectedPlannedSession,
    resetSelectedPlannedSession,
    setSelectedPlannedSession,
  } = useSelectedPlannedSessionStore();

  const listUrl = `/campaigns/${campaignId}/planned-sessions`;

  const { data, isLoading } = useGetEntityList<
    IPlannedSessionListItem,
    IPlannedSessionListFilters
  >({
    url: listUrl,
    filters,
  });

  const deletePlannedSessionMutation = useDeleteEntity({
    url: `${listUrl}/${plannedSessionPendingDelete?.id}`,
    invalidateQueryKeys: [[listUrl]],
    onSuccess: () => {
      showToast({
        message: 'Sessão planejada excluída com sucesso.',
        type: 'success',
      });
      setPlannedSessionPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a sessão planejada.',
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
    resetSelectedPlannedSession();
    setIsFormModalOpen(true);
  };

  const handleEdit = (plannedSession: IPlannedSessionListItem) => {
    setSelectedPlannedSession(plannedSession);
    setIsFormModalOpen(true);
  };

  const handleView = (plannedSession: IPlannedSessionListItem) => {
    setPlannedSessionPendingView(plannedSession);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedPlannedSession();
  };

  return (
    <div className="mt-10 flex flex-col">
      <div className="flex items-center justify-between gap-4">
        <Title component="h2" sx={{ textAlign: 'left' }}>
          Sessões Planejadas
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

      <PlannedSessionsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <PlannedSessionsList
        plannedSessions={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setPlannedSessionPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={
          selectedPlannedSession
            ? 'Editar sessão planejada'
            : 'Nova sessão planejada'
        }
        size="wide"
      >
        <PlannedSessionCreateForm
          campaignId={campaignId}
          onSaved={handleCloseFormModal}
        />
      </FormModal>

      <ViewModal
        open={!!plannedSessionPendingView}
        onClose={() => setPlannedSessionPendingView(null)}
        title="Detalhes da Sessão Planejada"
        size="wide"
      >
        {plannedSessionPendingView && (
          <PlannedSessionView
            campaignId={campaignId}
            plannedSessionId={plannedSessionPendingView.id}
          />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!plannedSessionPendingDelete}
        title="Excluir sessão planejada"
        message={`Tem certeza que deseja excluir a sessão planejada "${plannedSessionPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deletePlannedSessionMutation.isPending}
        onConfirm={() => deletePlannedSessionMutation.mutate()}
        onCancel={() => setPlannedSessionPendingDelete(null)}
      />
    </div>
  );
};
