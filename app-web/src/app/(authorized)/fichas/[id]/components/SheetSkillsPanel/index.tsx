'use client';

import { FiTarget } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { SheetSkillModifierResult } from '../../hooks/useSheetSkillModifiers';
import { SheetSkillCard } from '../SheetSkillCard';

export interface SheetSkillsPanelProps {
  items: SheetSkillModifierResult[];
  onOpenDetail: (skillId: string) => void;
}

export const SheetSkillsPanel = ({
  items,
  onOpenDetail,
}: SheetSkillsPanelProps) => {
  return (
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <FiTarget style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          Perícias
        </Label>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <DefaultText>Nenhuma perícia cadastrada.</DefaultText>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <SheetSkillCard
                key={item.id}
                name={item.name}
                keyAttributeName={item.keyAttributeName}
                gradationName={item.gradationName}
                total={item.total}
                onOpenDetail={() => onOpenDetail(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
