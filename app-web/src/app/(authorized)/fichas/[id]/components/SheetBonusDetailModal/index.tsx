'use client';

import { ViewModal } from '@/shared/components/Modals';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetBonusDetailBreakdownEntry {
  label: string;
  value: number;
}

/**
 * Detalhamento genérico de bônus (fontes + total), reaproveitado pelos fluxos
 * de Perícias (`useSheetSkillModifiers`) e Saberes
 * (`useSheetKnowledgeModifiers`) — cada hook já embute o `name`/`total`/
 * `breakdown` calculados no próprio item retornado.
 */
export interface SheetBonusDetail {
  name: string;
  total: number;
  breakdown: SheetBonusDetailBreakdownEntry[];
}

export interface SheetBonusDetailModalProps {
  open: boolean;
  onClose: () => void;
  detail: SheetBonusDetail | null;
}

const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

export const SheetBonusDetailModal = ({
  open,
  onClose,
  detail,
}: SheetBonusDetailModalProps) => {
  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title={`Bônus de ${detail?.name ?? ''}`}
    >
      <div className="flex flex-col gap-3">
        <div
          className="flex flex-col gap-2 p-3"
          style={APP_CONTAINER_STYLES.detailSectionBox}
        >
          {detail?.breakdown.map((entry) => (
            <DefaultText key={entry.label}>
              {`${formatSigned(entry.value)} ${entry.label}`}
            </DefaultText>
          ))}
        </div>

        <Label component="span" sx={{ margin: 0 }}>
          {`Total: ${formatSigned(detail?.total ?? 0)}`}
        </Label>
      </div>
    </ViewModal>
  );
};
