'use client';

import { DefaultText } from '@/shared/components/Texts';
import { ProficiencyCard } from '@/shared/components/ProficiencyCard';
import { ISheetProficiencySnapshotEntry } from '@/shared/interfaces';

export interface SheetProficienciesGridProps {
  items: ISheetProficiencySnapshotEntry[];
  emptyMessage?: string;
}

export const SheetProficienciesGrid = ({
  items,
  emptyMessage = 'Nenhuma proficiência vinculada.',
}: SheetProficienciesGridProps) => {
  if (items.length === 0) {
    return <DefaultText>{emptyMessage}</DefaultText>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1">
          <ProficiencyCard item={item} />
          <DefaultText sx={{ fontStyle: 'italic', marginLeft: '8px' }}>
            {`Concedida por: ${item.sourceName}`}
          </DefaultText>
        </div>
      ))}
    </div>
  );
};
