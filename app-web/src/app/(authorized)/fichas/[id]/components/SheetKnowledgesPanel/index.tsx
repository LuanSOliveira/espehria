'use client';

import { FiBookOpen } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { SheetKnowledgeModifierResult } from '../../hooks/useSheetKnowledgeModifiers';
import { SheetKnowledgeCard } from '../SheetKnowledgeCard';

export interface SheetKnowledgesPanelProps {
  items: SheetKnowledgeModifierResult[];
  onOpenDetail: (knowledgeId: string) => void;
  onSaveNote: (knowledgeId: string, note: string) => void;
  isSavingNote: (knowledgeId: string) => boolean;
}

export const SheetKnowledgesPanel = ({
  items,
  onOpenDetail,
  onSaveNote,
  isSavingNote,
}: SheetKnowledgesPanelProps) => {
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
              <SheetKnowledgeCard
                key={item.id}
                title={item.title}
                gradationName={item.gradationName}
                sourceName={item.sourceName}
                editable={item.editable}
                note={item.note}
                total={item.total}
                onOpenDetail={() => onOpenDetail(item.id)}
                onSaveNote={(note) => onSaveNote(item.id, note)}
                isSavingNote={isSavingNote(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
