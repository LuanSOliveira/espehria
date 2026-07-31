'use client';

import { useState } from 'react';
import { SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { EntityReferenceSelectionModal } from '@/shared/components/EntityReferenceSelectionModal';
import { IEntityReference } from '@/shared/interfaces';
import { showToast } from '@/shared/util';

export interface EntityReferenceListFieldProps {
  label: string;
  addButtonLabel: string;
  value: IEntityReference[];
  onChange: (value: IEntityReference[]) => void;
  otherListValue: IEntityReference[];
  currentEntityType: string;
  currentEntityId?: string;
}

const isSameReference = (
  a: { entityType: string; id: string },
  b: { entityType: string; id: string },
) => a.entityType === b.entityType && a.id === b.id;

export const EntityReferenceListField = ({
  label,
  addButtonLabel,
  value,
  onChange,
  otherListValue,
  currentEntityType,
  currentEntityId,
}: EntityReferenceListFieldProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (reference: IEntityReference) => {
    if (
      reference.entityType === currentEntityType &&
      reference.id === currentEntityId
    ) {
      showToast({
        message: 'Um item não pode ser adicionado à própria lista.',
        type: 'error',
      });
      return;
    }

    if (value.some((item) => isSameReference(item, reference))) {
      showToast({
        message: 'Este item já foi adicionado a esta lista.',
        type: 'error',
      });
      return;
    }

    if (otherListValue.some((item) => isSameReference(item, reference))) {
      showToast({
        message:
          'Este item já está presente na outra lista e não pode ser adicionado aqui.',
        type: 'error',
      });
      return;
    }

    onChange([...value, reference]);
  };

  const handleRemove = (reference: IEntityReference) => {
    onChange(value.filter((item) => !isSameReference(item, reference)));
  };

  return (
    <div className="flex flex-col gap-3">
      <Label component="span" sx={{ margin: 0 }}>
        {label}
      </Label>

      <SecondaryButton
        type="button"
        onClick={() => setIsModalOpen(true)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {addButtonLabel}
      </SecondaryButton>

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((reference) => (
            <EntityReferenceCard
              key={`${reference.entityType}-${reference.id}`}
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
        title={addButtonLabel}
        excludeReferences={value}
        onSelect={handleSelect}
      />
    </div>
  );
};
