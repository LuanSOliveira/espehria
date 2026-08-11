'use client';

import { Label } from '@/shared/components/Texts';
import { ISheetAbilityCard } from '@/shared/interfaces';
import { SheetAbilityCard } from '../SheetAbilityCard';
import { SheetDashedFieldButton } from '../SheetDashedFieldButton';

export interface SheetTrainingSlotCellProps {
  unlockedAtLevel: number;
  training: ISheetAbilityCard | null;
  /** Abre o modal de seleção de Treinamento para preencher este slot vazio. */
  onFill: () => void;
  onEmpty: () => void;
  isEmptying?: boolean;
}

/**
 * Composição específica de Treinamentos: card do treinamento (quando o slot
 * está preenchido) ou botão dashed (quando vazio), sempre com o indicativo
 * "Liberado no level {unlockedAtLevel}" abaixo — spec, requisito 12.
 */
export const SheetTrainingSlotCell = ({
  unlockedAtLevel,
  training,
  onFill,
  onEmpty,
  isEmptying = false,
}: SheetTrainingSlotCellProps) => {
  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex-1">
        {training ? (
          <SheetAbilityCard
            name={training.name}
            level={training.level}
            tags={training.tags}
            entityType="training"
            entityId={training.id}
            requirementsMet={training.requirementsMet}
            onRemove={onEmpty}
            isRemoving={isEmptying}
          />
        ) : (
          <SheetDashedFieldButton
            label="Preencher slot de treinamento"
            onClick={onFill}
          />
        )}
      </div>

      <Label component="span" sx={{ margin: 0, textAlign: 'center' }}>
        {`Liberado no level ${unlockedAtLevel}`}
      </Label>
    </div>
  );
};
