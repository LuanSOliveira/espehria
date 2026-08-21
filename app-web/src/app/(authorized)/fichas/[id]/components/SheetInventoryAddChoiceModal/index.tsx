'use client';

import { Dialog } from '@mui/material';
import { Card } from '@/shared/components/Containers';
import { DefaultText, Title } from '@/shared/components/Texts';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';

export interface SheetInventoryAddChoiceModalProps {
  open: boolean;
  categoryLabel: string;
  onClose: () => void;
  onChooseStandalone: () => void;
  onChooseExisting: () => void;
}

export const SheetInventoryAddChoiceModal = ({
  open,
  categoryLabel,
  onClose,
  onChooseStandalone,
  onChooseExisting,
}: SheetInventoryAddChoiceModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          className: 'bg-transparent shadow-none m-4',
        },
      }}
    >
      <Card>
        <Title component="h2" sx={{ marginBottom: '16px' }}>
          Adicionar item — {categoryLabel}
        </Title>

        <DefaultText sx={{ marginBottom: '24px' }}>
          O item será adicionado a partir de um cadastro avulso (não persiste no
          catálogo do sistema) ou de um item já existente no catálogo.
        </DefaultText>

        <div className="flex flex-col gap-3">
          <SecondaryButton type="button" onClick={onChooseStandalone}>
            Item avulso (novo)
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onChooseExisting}>
            Item existente (do catálogo)
          </PrimaryButton>
        </div>
      </Card>
    </Dialog>
  );
};
