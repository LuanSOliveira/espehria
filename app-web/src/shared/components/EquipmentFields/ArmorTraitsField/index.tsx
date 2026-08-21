'use client';

import { useState } from 'react';
import { SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { EntityReferenceSelectionModal } from '@/shared/components/EntityReferenceSelectionModal';
import { useArmaduraTraitTypeId } from '@/hooks/Queries';
import { IEntityReference } from '@/shared/interfaces';
import { showToast } from '@/shared/util';

export interface ArmorTraitsFieldProps {
  value: IEntityReference[];
  onChange: (value: IEntityReference[]) => void;
}

export const ArmorTraitsField = ({ value, onChange }: ArmorTraitsFieldProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { armaduraTraitTypeId, isLoading } = useArmaduraTraitTypeId();

  const handleSelect = (reference: IEntityReference) => {
    if (value.some((item) => item.id === reference.id)) {
      showToast({
        message: 'Este traço já foi adicionado.',
        type: 'error',
      });
      return;
    }

    onChange([...value, reference]);
  };

  const handleRemove = (reference: IEntityReference) => {
    onChange(value.filter((item) => item.id !== reference.id));
  };

  return (
    <div className="flex flex-col gap-3">
      <Label component="span" sx={{ margin: 0 }}>
        Traços
      </Label>

      <SecondaryButton
        type="button"
        disabled={isLoading}
        onClick={() => setIsModalOpen(true)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Adicionar Traço
      </SecondaryButton>

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((reference) => (
            <EntityReferenceCard
              key={reference.id}
              reference={reference}
              onRemove={() => handleRemove(reference)}
            />
          ))}
        </div>
      )}

      {value.length === 0 && <DefaultText>Nenhum item adicionado.</DefaultText>}

      <EntityReferenceSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Traço"
        excludeReferences={value.map((v) => ({ entityType: 'trait', id: v.id }))}
        onSelect={handleSelect}
        tabs={[
          {
            label: 'Traços',
            entityType: 'trait',
            url: '/traits',
            extraFilters: { traitTypeId: armaduraTraitTypeId },
          },
        ]}
      />
    </div>
  );
};
