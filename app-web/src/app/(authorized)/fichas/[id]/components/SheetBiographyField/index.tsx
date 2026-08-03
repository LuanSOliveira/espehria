'use client';

import { useState } from 'react';
import { Label } from '@/shared/components/Texts';
import { ViewModal } from '@/shared/components/Modals';
import { BiographyView } from '@/app/(authorized)/biografias/components/BiographyView';
import { IBiographyListItem } from '@/shared/interfaces';
import { SheetBiographyCard } from '../SheetBiographyCard';
import { SheetDashedFieldButton } from '../SheetDashedFieldButton';
import {
  SheetBiographyAssignInitialValue,
  SheetBiographyAssignModal,
  SheetBiographyAssignPayload,
} from '../SheetBiographyAssignModal';

export interface SheetBiographyFieldProps {
  value: IBiographyListItem | null;
  initialAssignValue?: SheetBiographyAssignInitialValue | null;
  onAssign: (payload: SheetBiographyAssignPayload) => void;
  onRemove: () => void;
  isSaving?: boolean;
  isRemoving?: boolean;
}

export const SheetBiographyField = ({
  value,
  initialAssignValue,
  onAssign,
  onRemove,
  isSaving,
  isRemoving,
}: SheetBiographyFieldProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleConfirm = (payload: SheetBiographyAssignPayload) => {
    onAssign(payload);
    setIsModalOpen(false);
  };

  return (
    <div>
      <Label component="span">Biografia</Label>

      {value ? (
        <SheetBiographyCard
          biography={value}
          onView={() => setIsViewModalOpen(true)}
          onEdit={() => setIsModalOpen(true)}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      ) : (
        <SheetDashedFieldButton
          label="Adicionar biografia"
          onClick={() => setIsModalOpen(true)}
        />
      )}

      <SheetBiographyAssignModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialValue={value ? initialAssignValue : null}
        onConfirm={handleConfirm}
        isSaving={isSaving}
      />

      <ViewModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes da Biografia"
        size="wide"
      >
        {value && <BiographyView biographyId={value.id} />}
      </ViewModal>
    </div>
  );
};
