'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import {
  useDeleteEntity,
  useGetEntityList,
  useSheetCampaignOptionsQuery,
} from '@/hooks/Queries';
import {
  ISheetCampaignOption,
  ISheetListFilters,
  ISheetListItem,
} from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { SheetsList } from './components/SheetsList';
import { SheetCreateForm } from './components/SheetCreateForm';
import { SheetsFilterSection } from './components/SheetsFilterSection';

export default function SheetsPage() {
  const [nameInput, setNameInput] = useState('');
  const [campaignInput, setCampaignInput] =
    useState<ISheetCampaignOption | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [sheetPendingDelete, setSheetPendingDelete] =
    useState<ISheetListItem | null>(null);
  const [filters, setFilters] = useState<ISheetListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { data: campaignOptionsData } = useSheetCampaignOptionsQuery();
  const campaignOptions = campaignOptionsData ?? [];

  const { data, isLoading } = useGetEntityList<
    ISheetListItem,
    ISheetListFilters
  >({
    url: '/sheets',
    filters,
  });

  const deleteSheetMutation = useDeleteEntity({
    url: `/sheets/${sheetPendingDelete?.id}`,
    invalidateQueryKeys: [['/sheets']],
    onSuccess: () => {
      showToast({
        message: 'Ficha excluída com sucesso.',
        type: 'success',
      });
      setSheetPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a ficha.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      campaignId: campaignInput?.id,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Fichas
        </Title>
        <PrimaryButton
          type="button"
          onClick={handleOpenCreateModal}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Novo
        </PrimaryButton>
      </div>

      <SheetsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        campaignValue={campaignInput}
        onCampaignChange={setCampaignInput}
        campaignOptions={campaignOptions}
        onSubmit={handleSearch}
      />

      <SheetsList
        sheets={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onDelete={setSheetPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title="Nova ficha"
      >
        <SheetCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ConfirmationModal
        open={!!sheetPendingDelete}
        title="Excluir ficha"
        message={`Tem certeza que deseja excluir a ficha "${sheetPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteSheetMutation.isPending}
        onConfirm={() => deleteSheetMutation.mutate()}
        onCancel={() => setSheetPendingDelete(null)}
      />
    </PageContainer>
  );
}
