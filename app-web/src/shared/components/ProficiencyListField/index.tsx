'use client';

import { useState } from 'react';
import { SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { ProficiencyCard } from '@/shared/components/ProficiencyCard';
import { ProficiencyAddModal } from '@/shared/components/ProficiencyAddModal';
import { IProficiencyItem } from '@/shared/interfaces';
import { showToast } from '@/shared/util';

export interface ProficiencyListFieldProps {
  label: string;
  addButtonLabel: string;
  value: IProficiencyItem[];
  onChange: (value: IProficiencyItem[]) => void;
}

export const ProficiencyListField = ({
  label,
  addButtonLabel,
  value,
  onChange,
}: ProficiencyListFieldProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = (item: IProficiencyItem) => {
    if (value.some((existing) => existing.property.id === item.property.id)) {
      showToast({
        message:
          'Esta propriedade já foi adicionada. Cada entidade só pode ter uma graduação por propriedade de proficiência.',
        type: 'error',
      });
      return;
    }

    onChange([...value, item]);
    setIsModalOpen(false);
  };

  const handleRemove = (item: IProficiencyItem) => {
    onChange(value.filter((existing) => existing.property.id !== item.property.id));
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
          {value.map((item) => (
            <ProficiencyCard
              key={item.property.id}
              item={item}
              onRemove={() => handleRemove(item)}
            />
          ))}
        </div>
      )}

      {value.length === 0 && <DefaultText>Nenhum item adicionado.</DefaultText>}

      <ProficiencyAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
};
