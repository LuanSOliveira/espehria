'use client';

import { SubmitEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { ICampaignListFilters, ICampaignListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { APP_ROUTES } from '@/shared/routes';
import { useSelectedCampaignStore } from '@/store';
import { CampaignsList } from './components/CampaignsList';
import { CampaignCreateForm } from './components/CampaignCreateForm';
import { CampaignsFilterSection } from './components/CampaignsFilterSection';

export default function CampaignsPage() {
  const router = useRouter();
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [campaignPendingDelete, setCampaignPendingDelete] =
    useState<ICampaignListItem | null>(null);
  const [filters, setFilters] = useState<ICampaignListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedCampaign, resetSelectedCampaign, setSelectedCampaign } =
    useSelectedCampaignStore();

  const { data, isLoading } = useGetEntityList<
    ICampaignListItem,
    ICampaignListFilters
  >({
    url: '/campaigns',
    filters,
  });

  const deleteCampaignMutation = useDeleteEntity({
    url: `/campaigns/${campaignPendingDelete?.id}`,
    invalidateQueryKeys: [['/campaigns']],
    onSuccess: () => {
      showToast({
        message: 'Campanha excluída com sucesso.',
        type: 'success',
      });
      setCampaignPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a campanha.',
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
    resetSelectedCampaign();
    setIsFormModalOpen(true);
  };

  const handleEdit = (campaign: ICampaignListItem) => {
    setSelectedCampaign(campaign);
    setIsFormModalOpen(true);
  };

  const handleView = (campaign: ICampaignListItem) => {
    router.push(APP_ROUTES.private.campaignDetails(campaign.id));
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedCampaign();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Campanhas
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

      <CampaignsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <CampaignsList
        campaigns={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setCampaignPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedCampaign ? 'Editar campanha' : 'Nova campanha'}
        size="wide"
      >
        <CampaignCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ConfirmationModal
        open={!!campaignPendingDelete}
        title="Excluir campanha"
        message={`Tem certeza que deseja excluir a campanha "${campaignPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteCampaignMutation.isPending}
        onConfirm={() => deleteCampaignMutation.mutate()}
        onCancel={() => setCampaignPendingDelete(null)}
      />
    </PageContainer>
  );
}
