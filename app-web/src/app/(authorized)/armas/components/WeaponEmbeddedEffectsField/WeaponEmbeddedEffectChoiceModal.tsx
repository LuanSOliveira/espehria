'use client';

import { FormModal } from '@/shared/components/Modals';
import { DefaultText } from '@/shared/components/Texts';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';

export interface WeaponEmbeddedEffectChoiceModalProps {
  open: boolean;
  onClose: () => void;
  entityLabel: string;
  onCreateBlank: () => void;
  onSelectExisting: () => void;
}

export const WeaponEmbeddedEffectChoiceModal = ({
  open,
  onClose,
  entityLabel,
  onCreateBlank,
  onSelectExisting,
}: WeaponEmbeddedEffectChoiceModalProps) => {
  const handleCreateBlank = () => {
    onCreateBlank();
    onClose();
  };

  const handleSelectExisting = () => {
    onSelectExisting();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Adicionar ${entityLabel}`}
      size="default"
    >
      <div className="flex flex-col gap-4">
        <DefaultText>
          {`Como deseja adicionar este ${entityLabel.toLowerCase()}?`}
        </DefaultText>

        <div className="flex justify-end gap-3">
          <SecondaryButton
            type="button"
            onClick={handleCreateBlank}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Criar avulso
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSelectExisting}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Selecionar existente
          </PrimaryButton>
        </div>
      </div>
    </FormModal>
  );
};
