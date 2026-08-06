'use client';

import { useState } from 'react';
import { SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { KnowledgeCard } from '@/shared/components/KnowledgeCard';
import { KnowledgeAddModal } from '@/shared/components/KnowledgeAddModal';
import { IKnowledgeItem } from '@/shared/interfaces';
import { showToast } from '@/shared/util';

export interface KnowledgeListFieldProps {
  label: string;
  addButtonLabel: string;
  value: IKnowledgeItem[];
  onChange: (value: IKnowledgeItem[]) => void;
}

const normalizeTitle = (title: string) => title.trim().toLowerCase();

export const KnowledgeListField = ({
  label,
  addButtonLabel,
  value,
  onChange,
}: KnowledgeListFieldProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = (item: IKnowledgeItem) => {
    if (
      value.some(
        (existing) => normalizeTitle(existing.title) === normalizeTitle(item.title),
      )
    ) {
      showToast({
        message:
          'Este saber já foi adicionado. Cada entidade só pode ter um saber por título (a comparação ignora maiúsculas/minúsculas e espaços nas pontas).',
        type: 'error',
      });
      return;
    }

    onChange([...value, item]);
    setIsModalOpen(false);
  };

  const handleRemove = (item: IKnowledgeItem) => {
    onChange(value.filter((existing) => existing.id !== item.id));
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
            <KnowledgeCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
            />
          ))}
        </div>
      )}

      {value.length === 0 && <DefaultText>Nenhum item adicionado.</DefaultText>}

      <KnowledgeAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
};
