'use client';

import { Dialog } from '@mui/material';
import { Card } from '@/shared/components/Containers';
import { DefaultText, Title } from '@/shared/components/Texts';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';

export interface ConfirmationModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = ({
  open,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth={false}
      slotProps={{
        paper: {
          className: 'bg-transparent shadow-none m-4',
        },
      }}
    >
      <Card>
        <Title component="h2" sx={{ marginBottom: '16px' }}>
          {title}
        </Title>

        <DefaultText sx={{ marginBottom: '24px' }}>{message}</DefaultText>

        <div className="flex justify-end gap-3">
          <SecondaryButton
            type="button"
            onClick={onCancel}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={onConfirm}
            isLoading={isLoading}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      </Card>
    </Dialog>
  );
};
