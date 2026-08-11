'use client';

import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import { FiStar } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { ISheetAbilityCard } from '@/shared/interfaces';
import { formatSheetAbilityOriginLabel } from '../../data';
import { SheetAbilityCard } from '../SheetAbilityCard';
import { SheetDashedFieldButton } from '../SheetDashedFieldButton';
import { SheetAbilitySelectionModal } from '../SheetAbilitySelectionModal';

export interface SheetTalentsPanelProps {
  sheetId: string;
  inherited: ISheetAbilityCard[];
  extras: ISheetAbilityCard[];
  onAddExtra: (talentId: string) => void;
  onRemoveExtra: (talentId: string) => void;
  isAdding?: boolean;
  isRemoving?: (talentId: string) => boolean;
  isLoading?: boolean;
}

export const SheetTalentsPanel = ({
  sheetId,
  inherited,
  extras,
  onAddExtra,
  onRemoveExtra,
  isAdding = false,
  isRemoving,
  isLoading = false,
}: SheetTalentsPanelProps) => {
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando talentos...</DefaultText>
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
          <FiStar style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Talentos
          </Label>
        </div>

        <div className="p-4">
          {inherited.length === 0 ? (
            <DefaultText>Nenhum talento herdado.</DefaultText>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {inherited.map((item) => (
                <SheetAbilityCard
                  key={`${item.id}-${item.origin?.entityType ?? 'none'}-${item.origin?.id ?? 'none'}`}
                  name={item.name}
                  level={item.level}
                  tags={item.tags}
                  entityType="talent"
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
          <FiStar style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Talentos Extras
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
                entityType="talent"
                entityId={item.id}
                requirementsMet={item.requirementsMet}
                onRemove={() => onRemoveExtra(item.id)}
                isRemoving={isRemoving?.(item.id)}
              />
            ))}

            <SheetDashedFieldButton
              label="Adicionar talentos extras"
              onClick={() => setIsSelectionModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <SheetAbilitySelectionModal
        open={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        title="Adicionar talento extra"
        entityType="talent"
        url="/talents"
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
