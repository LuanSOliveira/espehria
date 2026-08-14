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
import {
  useDeleteEntity,
  useGetEntityList,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  IArmorListFilters,
  IArmorListItem,
  ITag,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedArmorStore } from '@/store';
import { ArmorsList } from './components/ArmorsList';
import { ArmorCreateForm } from './components/ArmorCreateForm';
import { ArmorsFilterSection } from './components/ArmorsFilterSection';
import { ArmorView } from './components/ArmorView';

export default function ArmorsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [armorPendingDelete, setArmorPendingDelete] =
    useState<IArmorListItem | null>(null);
  const [armorPendingView, setArmorPendingView] =
    useState<IArmorListItem | null>(null);
  const [filters, setFilters] = useState<IArmorListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedArmor, resetSelectedArmor, setSelectedArmor } =
    useSelectedArmorStore();

  const { tagOptions } = useTagOptionsQuery();

  const { data, isLoading } = useGetEntityList<
    IArmorListItem,
    IArmorListFilters
  >({
    url: '/armors',
    filters,
  });

  const deleteArmorMutation = useDeleteEntity({
    url: `/armors/${armorPendingDelete?.id}`,
    invalidateQueryKeys: [['/armors']],
    onSuccess: () => {
      showToast({
        message: 'Armadura excluída com sucesso.',
        type: 'success',
      });
      setArmorPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a armadura.',
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
    resetSelectedArmor();
    setIsFormModalOpen(true);
  };

  const handleEdit = (armor: IArmorListItem) => {
    setSelectedArmor(armor);
    setIsFormModalOpen(true);
  };

  const handleView = (armor: IArmorListItem) => {
    setArmorPendingView(armor);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedArmor();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Armaduras
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

      <ArmorsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        tagsValue={selectedTags}
        onTagsChange={setSelectedTags}
        tagOptions={tagOptions}
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      <ArmorsList
        armors={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setArmorPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedArmor ? 'Editar armadura' : 'Nova armadura'}
        size="wide"
      >
        <ArmorCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!armorPendingView}
        onClose={() => setArmorPendingView(null)}
        title="Detalhes da Armadura"
        size="wide"
      >
        {armorPendingView && <ArmorView armorId={armorPendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!armorPendingDelete}
        title="Excluir armadura"
        message={`Tem certeza que deseja excluir a armadura "${armorPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteArmorMutation.isPending}
        onConfirm={() => deleteArmorMutation.mutate()}
        onCancel={() => setArmorPendingDelete(null)}
      />
    </PageContainer>
  );
}
