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
import { ISpellListFilters, ISpellListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedSpellStore } from '@/store';
import { SpellsList } from './components/SpellsList';
import { SpellCreateForm } from './components/SpellCreateForm';
import { SpellsFilterSection } from './components/SpellsFilterSection';
import { SpellView } from './components/SpellView';

export default function SpellsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [spellPendingDelete, setSpellPendingDelete] =
    useState<ISpellListItem | null>(null);
  const [spellPendingView, setSpellPendingView] =
    useState<ISpellListItem | null>(null);
  const [filters, setFilters] = useState<ISpellListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedSpell, resetSelectedSpell, setSelectedSpell } =
    useSelectedSpellStore();

  const { data, isLoading } = useGetEntityList<
    ISpellListItem,
    ISpellListFilters
  >({
    url: '/spells',
    filters,
  });

  const deleteSpellMutation = useDeleteEntity({
    url: `/spells/${spellPendingDelete?.id}`,
    invalidateQueryKeys: [['/spells']],
    onSuccess: () => {
      showToast({
        message: 'Magia excluída com sucesso.',
        type: 'success',
      });
      setSpellPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a magia.',
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
    resetSelectedSpell();
    setIsFormModalOpen(true);
  };

  const handleEdit = (spell: ISpellListItem) => {
    setSelectedSpell(spell);
    setIsFormModalOpen(true);
  };

  const handleView = (spell: ISpellListItem) => {
    setSpellPendingView(spell);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedSpell();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Magias
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

      <SpellsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <SpellsList
        spells={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setSpellPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedSpell ? 'Editar magia' : 'Nova magia'}
        size="wide"
      >
        <SpellCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!spellPendingView}
        onClose={() => setSpellPendingView(null)}
        title="Detalhes da Magia"
        size="wide"
      >
        {spellPendingView && <SpellView spellId={spellPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!spellPendingDelete}
        title="Excluir magia"
        message={`Tem certeza que deseja excluir a magia "${spellPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteSpellMutation.isPending}
        onConfirm={() => deleteSpellMutation.mutate()}
        onCancel={() => setSpellPendingDelete(null)}
      />
    </PageContainer>
  );
}
