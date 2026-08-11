'use client';

import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import { FiAward } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { ISheetAbilityCard } from '@/shared/interfaces';
import { formatSheetAbilityOriginLabel } from '../../data';
import { SheetAbilityCard } from '../SheetAbilityCard';
import { SheetDashedFieldButton } from '../SheetDashedFieldButton';
import { SheetAbilitySelectionModal } from '../SheetAbilitySelectionModal';

export interface SheetCharacteristicsPanelProps {
  sheetId: string;
  inherited: ISheetAbilityCard[];
  extras: ISheetAbilityCard[];
  onAddExtra: (characteristicId: string) => void;
  onRemoveExtra: (characteristicId: string) => void;
  isAdding?: boolean;
  isRemoving?: (characteristicId: string) => boolean;
  isLoading?: boolean;
}

export const SheetCharacteristicsPanel = ({
  sheetId,
  inherited,
  extras,
  onAddExtra,
  onRemoveExtra,
  isAdding = false,
  isRemoving,
  isLoading = false,
}: SheetCharacteristicsPanelProps) => {
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando características...</DefaultText>
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
          <FiAward style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Características
          </Label>
        </div>

        <div className="p-4">
          {inherited.length === 0 ? (
            <DefaultText>Nenhuma característica herdada.</DefaultText>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {inherited.map((item) => (
                <SheetAbilityCard
                  key={`${item.id}-${item.origin?.entityType ?? 'none'}-${item.origin?.id ?? 'none'}`}
                  name={item.name}
                  level={item.level}
                  tags={item.tags}
                  entityType="characteristic"
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
          <FiAward style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Características Extras
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
                entityType="characteristic"
                entityId={item.id}
                requirementsMet={item.requirementsMet}
                onRemove={() => onRemoveExtra(item.id)}
                isRemoving={isRemoving?.(item.id)}
              />
            ))}

            <SheetDashedFieldButton
              label="Adicionar características extras"
              onClick={() => setIsSelectionModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <SheetAbilitySelectionModal
        open={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        title="Adicionar característica extra"
        entityType="characteristic"
        url="/characteristics"
        sheetId={sheetId}
        isSelecting={isAdding}
        onSelect={(item) => {
          onAddExtra(item.id);
          setIsSelectionModalOpen(false);
        }}
      />
    </div>
  );
};
