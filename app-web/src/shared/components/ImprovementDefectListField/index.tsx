'use client';

import { useState } from 'react';
import { SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { ImprovementDefectCard } from '@/shared/components/ImprovementDefectCard';
import { ImprovementDefectAddModal } from '@/shared/components/ImprovementDefectAddModal';
import { IImprovementDefectItem } from '@/shared/interfaces';
import { showToast } from '@/shared/util';

export interface ImprovementDefectListFieldProps {
  label: string;
  addButtonLabel: string;
  category: 'improvement' | 'flaw';
  value: IImprovementDefectItem[];
  onChange: (value: IImprovementDefectItem[]) => void;
  otherListValue: IImprovementDefectItem[];
}

const isSameCombination = (
  a: IImprovementDefectItem,
  b: IImprovementDefectItem,
) => a.type.id === b.type.id && a.property.id === b.property.id;

export const ImprovementDefectListField = ({
  label,
  addButtonLabel,
  category,
  value,
  onChange,
  otherListValue,
}: ImprovementDefectListFieldProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = (item: IImprovementDefectItem) => {
    if (value.some((existing) => isSameCombination(existing, item))) {
      showToast({
        message:
          'Esta combinação de tipo e propriedade já foi adicionada a esta lista.',
        type: 'error',
      });
      return;
    }

    if (otherListValue.some((existing) => isSameCombination(existing, item))) {
      showToast({
        message:
          'Esta combinação de tipo e propriedade já está presente na outra lista e não pode ser adicionada aqui.',
        type: 'error',
      });
      return;
    }

    onChange([...value, item]);
    setIsModalOpen(false);
  };

  const handleRemove = (item: IImprovementDefectItem) => {
    onChange(value.filter((existing) => !isSameCombination(existing, item)));
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
            <ImprovementDefectCard
              key={`${item.type.id}-${item.property.id}`}
              item={item}
              onRemove={() => handleRemove(item)}
            />
          ))}
        </div>
      )}

      {value.length === 0 && <DefaultText>Nenhum item adicionado.</DefaultText>}

      <ImprovementDefectAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={category}
        onAdd={handleAdd}
      />
    </div>
  );
};
