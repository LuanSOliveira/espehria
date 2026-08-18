'use client';

import { IconType } from 'react-icons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { IEmbeddedEffect } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface EmbeddedEffectsSectionViewProps {
  icon: IconType;
  label: string;
  items: IEmbeddedEffect[];
  emptyLabel?: string;
}

export const EmbeddedEffectsSectionView = ({
  icon: Icon,
  label,
  items,
  emptyLabel = 'Não informado',
}: EmbeddedEffectsSectionViewProps) => {
  return (
    <div
      className="flex-1 min-w-0 flex flex-col"
      style={APP_CONTAINER_STYLES.detailSectionBox}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <Icon style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          {label}
        </Label>
      </div>
      <div className="flex flex-col gap-3 px-3 py-3">
        {items.length === 0 && (
          <DefaultText>Nenhum item adicionado.</DefaultText>
        )}
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`}>
            <Label component="span" sx={{ margin: 0 }}>
              {item.name}
            </Label>
            <RichTextViewer value={item.effect} emptyLabel={emptyLabel} />
          </div>
        ))}
      </div>
    </div>
  );
};
