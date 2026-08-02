'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/shared/components/Modals';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';

export interface SheetImageEditModalProps {
  open: boolean;
  onClose: () => void;
  currentImageUrl?: string | null;
  onSave: (url: string) => void;
  isSaving?: boolean;
}

export const SheetImageEditModal = ({
  open,
  onClose,
  currentImageUrl,
  onSave,
  isSaving = false,
}: SheetImageEditModalProps) => {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (open) {
      setImageUrl(currentImageUrl ?? '');
    }
  }, [open, currentImageUrl]);

  const handleSave = () => {
    onSave(imageUrl.trim());
  };

  return (
    <FormModal open={open} onClose={onClose} title="Editar imagem da ficha">
      <div className="flex flex-col gap-4">
        <DefaultTextInput
          id="sheet-image-edit-url"
          label="URL da imagem"
          placeholder="https://exemplo.com/imagem.jpg"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
        />

        <div className="flex justify-end gap-3">
          <SecondaryButton
            type="button"
            onClick={onClose}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSave}
            isLoading={isSaving}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Salvar
          </PrimaryButton>
        </div>
      </div>
    </FormModal>
  );
};
