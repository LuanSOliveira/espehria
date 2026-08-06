'use client';

import { FiBookOpen } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { KnowledgeCard } from '@/shared/components/KnowledgeCard';
import { ISheetKnowledgeSnapshotEntry } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetKnowledgesPanelProps {
  items: ISheetKnowledgeSnapshotEntry[];
}

export const SheetKnowledgesPanel = ({ items }: SheetKnowledgesPanelProps) => {
  return (
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <FiBookOpen style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          Saberes
        </Label>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <DefaultText>Nenhum saber vinculado.</DefaultText>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-1">
                <KnowledgeCard item={item} />
                <DefaultText sx={{ fontStyle: 'italic', marginLeft: '8px' }}>
                  {`Concedida por: ${item.sourceName}`}
                </DefaultText>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
