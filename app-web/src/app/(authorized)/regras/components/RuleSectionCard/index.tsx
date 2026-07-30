'use client';

import { FiFileText } from 'react-icons/fi';
import { Label } from '@/shared/components/Texts';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { IRuleSection } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface RuleSectionCardProps {
  section: IRuleSection;
}

export const RuleSectionCard = ({ section }: RuleSectionCardProps) => {
  return (
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <FiFileText style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          {section.label}
        </Label>
      </div>
      <div className="px-3 py-3">
        <RichTextViewer value={section.description} />
      </div>
    </div>
  );
};
