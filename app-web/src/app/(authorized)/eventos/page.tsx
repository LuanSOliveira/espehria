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
import {
  useDeleteEntity,
  useErasAllQuery,
  useGetEntityList,
} from '@/hooks/Queries';
import {
  IEraOption,
  IEventListFilters,
  IEventListItem,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedEventStore } from '@/store';
import { EventsList } from './components/EventsList';
import { EventCreateForm } from './components/EventCreateForm';
import { EventsFilterSection } from './components/EventsFilterSection';
import { EventView } from './components/EventView';

export default function EventsPage() {
  const [nameInput, setNameInput] = useState('');
  const [startYearInput, setStartYearInput] = useState('');
  const [endYearInput, setEndYearInput] = useState('');
  const [eraFilter, setEraFilter] = useState<IEraOption | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [eventPendingDelete, setEventPendingDelete] =
    useState<IEventListItem | null>(null);
  const [eventPendingView, setEventPendingView] =
    useState<IEventListItem | null>(null);
  const [filters, setFilters] = useState<IEventListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedEvent, resetSelectedEvent, setSelectedEvent } =
    useSelectedEventStore();

  const { data: eras } = useErasAllQuery();

  const { data, isLoading } = useGetEntityList<
    IEventListItem,
    IEventListFilters
  >({
    url: '/events',
    filters,
  });

  const deleteEventMutation = useDeleteEntity({
    url: `/events/${eventPendingDelete?.id}`,
    invalidateQueryKeys: [['/events']],
    onSuccess: () => {
      showToast({
        message: 'Evento excluído com sucesso.',
        type: 'success',
      });
      setEventPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o evento.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      startYear: startYearInput.trim() ? Number(startYearInput.trim()) : undefined,
      endYear: endYearInput.trim() ? Number(endYearInput.trim()) : undefined,
      eraId: eraFilter?.id,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedEvent();
    setIsFormModalOpen(true);
  };

  const handleEdit = (event: IEventListItem) => {
    setSelectedEvent(event);
    setIsFormModalOpen(true);
  };

  const handleView = (event: IEventListItem) => {
    setEventPendingView(event);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedEvent();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Eventos
        </Title>
        <PrimaryButton
          type="button"
          onClick={handleOpenCreateModal}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Novo
        </PrimaryButton>
      </div>

      <EventsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        startYearValue={startYearInput}
        onStartYearChange={setStartYearInput}
        endYearValue={endYearInput}
        onEndYearChange={setEndYearInput}
        eraValue={eraFilter}
        onEraChange={setEraFilter}
        eras={eras ?? []}
        onSubmit={handleSearch}
      />

      <EventsList
        events={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setEventPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedEvent ? 'Editar evento' : 'Novo evento'}
        size="wide"
      >
        <EventCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!eventPendingView}
        onClose={() => setEventPendingView(null)}
        title="Detalhes do Evento"
        size="wide"
      >
        {eventPendingView && <EventView eventId={eventPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!eventPendingDelete}
        title="Excluir evento"
        message={`Tem certeza que deseja excluir o evento "${eventPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteEventMutation.isPending}
        onConfirm={() => deleteEventMutation.mutate()}
        onCancel={() => setEventPendingDelete(null)}
      />
    </PageContainer>
  );
}
