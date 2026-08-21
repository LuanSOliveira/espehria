'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@mui/material';
import { Card } from '@/shared/components/Containers';
import { DefaultText, Title } from '@/shared/components/Texts';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { APP_COLORS } from '@/shared/constants';

export interface SheetInventoryQuantityModalProps {
  open: boolean;
  mode: 'add' | 'remove';
  itemName: string;
  unitVolume: number;
  /** Obrigatório em `mode="remove"` (quantidade atual do card). */
  maxQuantity?: number;
  currentLoadedVolume: number;
  limitVolume: number;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SheetInventoryQuantityModal = ({
  open,
  mode,
  itemName,
  unitVolume,
  maxQuantity,
  currentLoadedVolume,
  limitVolume,
  onConfirm,
  onCancel,
  isLoading = false,
}: SheetInventoryQuantityModalProps) => {
  const [quantityInput, setQuantityInput] = useState('1');

  useEffect(() => {
    if (open) {
      setQuantityInput('1');
    }
  }, [open]);

  const quantity = Number(quantityInput);
  const isQuantityValid =
    quantityInput !== '' &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    (mode === 'add' || (maxQuantity != null && quantity <= maxQuantity));

  const additionalVolume = unitVolume * (Number.isFinite(quantity) ? quantity : 0);
  const newLoadedVolume = currentLoadedVolume + additionalVolume;
  const exceedsLimit = mode === 'add' && newLoadedVolume > limitVolume;

  const canConfirm = isQuantityValid && !exceedsLimit;

  const handleConfirm = () => {
    if (!canConfirm) {
      return;
    }

    onConfirm(quantity);
  };

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
          {mode === 'add' ? 'Quantidade a adicionar' : 'Quantidade a remover'}
        </Title>

        <DefaultText sx={{ marginBottom: '16px' }}>{itemName}</DefaultText>

        <DefaultTextInput
          id="sheet-inventory-quantity-input"
          label="Quantidade"
          type="number"
          value={quantityInput}
          onChange={(event) => setQuantityInput(event.target.value)}
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />

        {mode === 'remove' && maxQuantity != null && (
          <DefaultText sx={{ marginTop: '8px' }}>
            {`Máximo: ${maxQuantity}`}
          </DefaultText>
        )}

        {exceedsLimit && (
          <DefaultText sx={{ marginTop: '8px', color: APP_COLORS.alertRed }}>
            {`Não é possível adicionar essa quantidade: o volume ultrapassaria o Volume Limite da ficha (${limitVolume}).`}
          </DefaultText>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <SecondaryButton
            type="button"
            onClick={onCancel}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            isLoading={isLoading}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Confirmar
          </PrimaryButton>
        </div>
      </Card>
    </Dialog>
  );
};
