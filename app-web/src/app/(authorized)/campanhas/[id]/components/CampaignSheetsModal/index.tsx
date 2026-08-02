'use client';

import { useEffect, useState } from 'react';
import { useCampaignSheetsQuery, useDeleteEntity } from '@/hooks/Queries';
import { ConfirmationModal, ViewModal } from '@/shared/components/Modals';
import { ICampaignSheetListItem } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { CampaignSheetsList } from '../CampaignSheetsList';

export interface CampaignSheetsModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
}

export const CampaignSheetsModal = ({
  open,
  onClose,
  campaignId,
}: CampaignSheetsModalProps) => {
  const [sheetPendingUnassign, setSheetPendingUnassign] =
    useState<ICampaignSheetListItem | null>(null);

  const listUrl = `/campaigns/${campaignId}/sheets`;

  const { data, isLoading, isError, error } = useCampaignSheetsQuery({
    campaignId,
    enabled: open,
  });

  useEffect(() => {
    if (!isError) {
      return;
    }

    showToast({
      message:
        error?.response?.data?.message ??
        'Não foi possível carregar as fichas desta campanha.',
      type: 'error',
    });
  }, [isError, error]);

  const unassignSheetMutation = useDeleteEntity({
    url: `${listUrl}/${sheetPendingUnassign?.id}`,
    invalidateQueryKeys: [[listUrl], ['/sheets']],
    onSuccess: () => {
      showToast({
        message: 'Ficha desvinculada da campanha com sucesso.',
        type: 'success',
      });
      setSheetPendingUnassign(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível desvincular a ficha desta campanha.',
        type: 'error',
      });
    },
  });

  return (
    <>
      <ViewModal open={open} onClose={onClose} title="Fichas Cadastradas" size="wide">
        <CampaignSheetsList
          sheets={data ?? []}
          isLoading={isLoading}
          isError={isError}
          onUnassign={setSheetPendingUnassign}
        />
      </ViewModal>

      <ConfirmationModal
        open={!!sheetPendingUnassign}
        title="Desvincular ficha"
        message={`Tem certeza que deseja desvincular a ficha "${sheetPendingUnassign?.name}" desta campanha? A ficha não será excluída, apenas deixará de pertencer a esta campanha.`}
        confirmLabel="Desvincular"
        isLoading={unassignSheetMutation.isPending}
        onConfirm={() => unassignSheetMutation.mutate()}
        onCancel={() => setSheetPendingUnassign(null)}
      />
    </>
  );
};
