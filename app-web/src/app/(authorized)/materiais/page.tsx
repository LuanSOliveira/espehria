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
import { IMaterialListFilters, IMaterialListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedMaterialStore } from '@/store';
import { MaterialsList } from './components/MaterialsList';
import { MaterialCreateForm } from './components/MaterialCreateForm';
import { MaterialsFilterSection } from './components/MaterialsFilterSection';
import { MaterialView } from './components/MaterialView';

export default function MaterialsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [materialPendingDelete, setMaterialPendingDelete] =
    useState<IMaterialListItem | null>(null);
  const [materialPendingView, setMaterialPendingView] =
    useState<IMaterialListItem | null>(null);
  const [filters, setFilters] = useState<IMaterialListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedMaterial, resetSelectedMaterial, setSelectedMaterial } =
    useSelectedMaterialStore();

  const { data, isLoading } = useGetEntityList<
    IMaterialListItem,
    IMaterialListFilters
  >({
    url: '/materials',
    filters,
  });

  const deleteMaterialMutation = useDeleteEntity({
    url: `/materials/${materialPendingDelete?.id}`,
    invalidateQueryKeys: [['/materials']],
    onSuccess: () => {
      showToast({
        message: 'Material excluído com sucesso.',
        type: 'success',
      });
      setMaterialPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir o material.',
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
    resetSelectedMaterial();
    setIsFormModalOpen(true);
  };

  const handleEdit = (material: IMaterialListItem) => {
    setSelectedMaterial(material);
    setIsFormModalOpen(true);
  };

  const handleView = (material: IMaterialListItem) => {
    setMaterialPendingView(material);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedMaterial();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Materiais
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

      <MaterialsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <MaterialsList
        materials={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setMaterialPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedMaterial ? 'Editar material' : 'Novo material'}
        size="wide"
      >
        <MaterialCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!materialPendingView}
        onClose={() => setMaterialPendingView(null)}
        title="Detalhes do Material"
        size="wide"
      >
        {materialPendingView && (
          <MaterialView materialId={materialPendingView.id} />
        )}
      </ViewModal>

      <ConfirmationModal
        open={!!materialPendingDelete}
        title="Excluir material"
        message={`Tem certeza que deseja excluir o material "${materialPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteMaterialMutation.isPending}
        onConfirm={() => deleteMaterialMutation.mutate()}
        onCancel={() => setMaterialPendingDelete(null)}
      />
    </PageContainer>
  );
}
