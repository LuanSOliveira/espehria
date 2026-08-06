'use client';

import { ViewModal } from '@/shared/components/Modals';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_CONTAINER_STYLES } from '@/shared/constants';
import { SheetSkillModifierResult } from '../../hooks/useSheetSkillModifiers';

export interface SheetSkillBonusDetailModalProps {
  open: boolean;
  onClose: () => void;
  skill: SheetSkillModifierResult | null;
}

const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

export const SheetSkillBonusDetailModal = ({
  open,
  onClose,
  skill,
}: SheetSkillBonusDetailModalProps) => {
  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title={`Bônus de ${skill?.name ?? ''}`}
    >
      <div className="flex flex-col gap-3">
        <div
          className="flex flex-col gap-2 p-3"
          style={APP_CONTAINER_STYLES.detailSectionBox}
        >
          {skill?.breakdown.map((entry) => (
            <DefaultText key={entry.label}>
              {`${formatSigned(entry.value)} ${entry.label}`}
            </DefaultText>
          ))}
        </div>

        <Label component="span" sx={{ margin: 0 }}>
          {`Total: ${formatSigned(skill?.total ?? 0)}`}
        </Label>
      </div>
    </ViewModal>
  );
};
