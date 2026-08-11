'use client';

import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import { FiBookOpen } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { ISheetAbilityCard, ISheetTrainingSlot } from '@/shared/interfaces';
import { formatSheetAbilityOriginLabel } from '../../data';
import { SheetAbilityCard } from '../SheetAbilityCard';
import { SheetDashedFieldButton } from '../SheetDashedFieldButton';
import { SheetTrainingSlotCell } from '../SheetTrainingSlotCell';
import { SheetAbilitySelectionModal } from '../SheetAbilitySelectionModal';

export interface SheetTrainingsPanelProps {
  sheetId: string;
  slots: ISheetTrainingSlot[];
  inherited: ISheetAbilityCard[];
  extras: ISheetAbilityCard[];
  onFillSlot: (slotIndex: number, trainingId: string) => void;
  onEmptySlot: (slotIndex: number) => void;
  onAddExtra: (trainingId: string) => void;
  onRemoveExtra: (trainingId: string) => void;
  isFillingSlot?: boolean;
  isEmptyingSlot?: (slotIndex: number) => boolean;
  isAddingExtra?: boolean;
  isRemovingExtra?: (trainingId: string) => boolean;
  isLoading?: boolean;
}

export const SheetTrainingsPanel = ({
  sheetId,
  slots,
  inherited,
  extras,
  onFillSlot,
  onEmptySlot,
  onAddExtra,
  onRemoveExtra,
  isFillingSlot = false,
  isEmptyingSlot,
  isAddingExtra = false,
  isRemovingExtra,
  isLoading = false,
}: SheetTrainingsPanelProps) => {
  const [slotIndexPendingFill, setSlotIndexPendingFill] = useState<number | null>(
    null,
  );
  const [isExtraSelectionModalOpen, setIsExtraSelectionModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando treinamentos...</DefaultText>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div style={APP_CONTAINER_STYLES.detailSectionBox}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiBookOpen style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Treinamentos
          </Label>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {slots.map((slot) => (
              <SheetTrainingSlotCell
                key={slot.slotIndex}
                unlockedAtLevel={slot.unlockedAtLevel}
                training={slot.training}
                onFill={() => setSlotIndexPendingFill(slot.slotIndex)}
                onEmpty={() => onEmptySlot(slot.slotIndex)}
                isEmptying={isEmptyingSlot?.(slot.slotIndex)}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={APP_CONTAINER_STYLES.detailSectionBox}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiBookOpen style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Treinamentos Herdados
          </Label>
        </div>

        <div className="p-4">
          {inherited.length === 0 ? (
            <DefaultText>Nenhum treinamento herdado.</DefaultText>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {inherited.map((item) => (
                <SheetAbilityCard
                  key={`${item.id}-${item.origin?.entityType ?? 'none'}-${item.origin?.id ?? 'none'}`}
                  name={item.name}
                  level={item.level}
                  tags={item.tags}
                  entityType="training"
                  entityId={item.id}
                  requirementsMet={item.requirementsMet}
                  sourceLabel={
                    item.origin ? formatSheetAbilityOriginLabel(item.origin) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={APP_CONTAINER_STYLES.detailSectionBox}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiBookOpen style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Treinamentos Extras
          </Label>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {extras.map((item) => (
              <SheetAbilityCard
                key={item.id}
                name={item.name}
                level={item.level}
                tags={item.tags}
                entityType="training"
                entityId={item.id}
                requirementsMet={item.requirementsMet}
                onRemove={() => onRemoveExtra(item.id)}
                isRemoving={isRemovingExtra?.(item.id)}
              />
            ))}

            <SheetDashedFieldButton
              label="Adicionar treinamentos extras"
              onClick={() => setIsExtraSelectionModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <SheetAbilitySelectionModal
        open={slotIndexPendingFill !== null}
        onClose={() => setSlotIndexPendingFill(null)}
        title="Preencher slot de treinamento"
        entityType="training"
        url="/trainings"
        sheetId={sheetId}
        isSelecting={isFillingSlot}
        onSelect={(item) => {
          if (slotIndexPendingFill !== null) {
            onFillSlot(slotIndexPendingFill, item.id);
          }
          setSlotIndexPendingFill(null);
        }}
      />

      <SheetAbilitySelectionModal
        open={isExtraSelectionModalOpen}
        onClose={() => setIsExtraSelectionModalOpen(false)}
        title="Adicionar treinamento extra"
        entityType="training"
        url="/trainings"
        sheetId={sheetId}
        isSelecting={isAddingExtra}
        onSelect={(item) => {
          onAddExtra(item.id);
          setIsExtraSelectionModalOpen(false);
        }}
      />
    </div>
  );
};
