'use client';

import { useState } from 'react';
import { Label } from '@/shared/components/Texts';
import { ViewModal, ConfirmationModal } from '@/shared/components/Modals';
import { RaceView } from '@/app/(authorized)/racas/components/RaceView';
import { IRaceListItem } from '@/shared/interfaces';
import { SheetRaceCard } from '../SheetRaceCard';
import { SheetDashedFieldButton } from '../SheetDashedFieldButton';
import { SheetRaceSelectionModal } from '../SheetRaceSelectionModal';

export interface SheetRaceFieldProps {
  value: IRaceListItem | null;
  onAssign: (raceId: string) => void;
  onRemove: () => void;
  isSaving?: boolean;
  isRemoving?: boolean;
}

export const SheetRaceField = ({
  value,
  onAssign,
  onRemove,
  isSaving,
  isRemoving,
}: SheetRaceFieldProps) => {
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [pendingRace, setPendingRace] = useState<IRaceListItem | null>(null);
  const [isChangeConfirmOpen, setIsChangeConfirmOpen] = useState(false);

  const handleSelectRace = (race: IRaceListItem) => {
    if (!value) {
      onAssign(race.id);
      setIsSelectionModalOpen(false);
      return;
    }

    setIsSelectionModalOpen(false);
    setPendingRace(race);
    setIsChangeConfirmOpen(true);
  };

  const handleConfirmChange = () => {
    if (!pendingRace) {
      return;
    }

    onAssign(pendingRace.id);
    setIsChangeConfirmOpen(false);
    setPendingRace(null);
  };

  const handleCancelChange = () => {
    setIsChangeConfirmOpen(false);
    setPendingRace(null);
  };

  return (
    <div>
      <Label component="span">Raça</Label>

      {value && (
        <SheetRaceCard
          race={value}
          onView={() => setIsViewModalOpen(true)}
          onEdit={() => setIsSelectionModalOpen(true)}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      )}

      {!value && (
        <SheetDashedFieldButton
          label="Adicionar raça"
          onClick={() => setIsSelectionModalOpen(true)}
        />
      )}

      <SheetRaceSelectionModal
        open={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSelect={handleSelectRace}
        isSelecting={isSaving}
      />

      <ViewModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes da Raça"
        size="wide"
      >
        {value && <RaceView raceId={value.id} />}
      </ViewModal>

      <ConfirmationModal
        open={isChangeConfirmOpen}
        title="Trocar raça"
        message="Trocar a raça impacta características, talentos e pontos de vida da ficha. Deseja continuar?"
        confirmLabel="Trocar"
        isLoading={isSaving}
        onConfirm={handleConfirmChange}
        onCancel={handleCancelChange}
      />
    </div>
  );
};
