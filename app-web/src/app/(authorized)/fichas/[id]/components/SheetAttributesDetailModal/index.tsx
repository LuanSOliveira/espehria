'use client';

import { FiArrowDownCircle, FiArrowUpCircle } from 'react-icons/fi';
import { ViewModal } from '@/shared/components/Modals';
import { DefaultText, Label } from '@/shared/components/Texts';
import { ImprovementDefectCard } from '@/shared/components/ImprovementDefectCard';
import { ISheetImprovementDefectSnapshotEntry } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { SheetImprovementDefectCategoryKey } from '../../data';

export interface SheetAttributesDetailGroup {
  key: SheetImprovementDefectCategoryKey;
  label: string;
  improvements: ISheetImprovementDefectSnapshotEntry[];
  flaws: ISheetImprovementDefectSnapshotEntry[];
}

export interface SheetAttributesDetailModalProps {
  open: boolean;
  onClose: () => void;
  groups: SheetAttributesDetailGroup[];
}

export const SheetAttributesDetailModal = ({
  open,
  onClose,
  groups,
}: SheetAttributesDetailModalProps) => {
  return (
    <ViewModal open={open} onClose={onClose} title="Melhorias e Defeitos de Atributo" size="wide">
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.key} style={APP_CONTAINER_STYLES.detailSectionBox}>
            <div
              className="px-3 py-2"
              style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
            >
              <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
                {group.label}
              </Label>
            </div>

            <div className="grid grid-cols-1 gap-4 p-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FiArrowUpCircle
                    style={{ fontSize: 16, color: APP_COLORS.goldSoft }}
                  />
                  <Label component="span" sx={{ margin: 0 }}>
                    Melhorias
                  </Label>
                </div>

                {group.improvements.length === 0 && (
                  <DefaultText>Nenhum item adicionado.</DefaultText>
                )}
                {group.improvements.map((item) => (
                  <ImprovementDefectCard
                    key={`${item.id ?? 'livre'}-${item.type.id}-${item.property.id}`}
                    item={item}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FiArrowDownCircle
                    style={{ fontSize: 16, color: APP_COLORS.goldSoft }}
                  />
                  <Label component="span" sx={{ margin: 0 }}>
                    Defeitos
                  </Label>
                </div>

                {group.flaws.length === 0 && (
                  <DefaultText>Nenhum item adicionado.</DefaultText>
                )}
                {group.flaws.map((item) => (
                  <ImprovementDefectCard
                    key={`${item.id ?? 'livre'}-${item.type.id}-${item.property.id}`}
                    item={item}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ViewModal>
  );
};
