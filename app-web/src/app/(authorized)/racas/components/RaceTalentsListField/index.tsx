'use client';

import { useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import { SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { EntityReferenceSelectionModal } from '@/shared/components/EntityReferenceSelectionModal';
import { IEntityReference } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { APP_COLORS } from '@/shared/constants';

export interface RaceTalentsListFieldProps {
  value: IEntityReference[];
  onChange?: (value: IEntityReference[]) => void;
  readOnly?: boolean;
}

const isSameReference = (
  a: { entityType: string; id: string },
  b: { entityType: string; id: string },
) => a.entityType === b.entityType && a.id === b.id;

const RACE_TALENTS_LEVEL_TABS = ['1', '5', '9', '13', '17', 'Outros'] as const;

const RACE_TALENTS_KNOWN_LEVELS = [1, 5, 9, 13, 17];

const getTalentLevelTabLabel = (level?: number | null) => {
  if (
    level !== null &&
    level !== undefined &&
    RACE_TALENTS_KNOWN_LEVELS.includes(level)
  ) {
    return String(level);
  }

  return 'Outros';
};

export const RaceTalentsListField = ({
  value,
  onChange,
  readOnly = false,
}: RaceTalentsListFieldProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const activeTabLabel = RACE_TALENTS_LEVEL_TABS[activeTabIndex];
  const filteredValue = value.filter(
    (reference) => getTalentLevelTabLabel(reference.level) === activeTabLabel,
  );

  const handleSelect = (reference: IEntityReference) => {
    if (value.some((item) => isSameReference(item, reference))) {
      showToast({
        message: 'Este item já foi adicionado a esta lista.',
        type: 'error',
      });
      return;
    }

    onChange?.([...value, reference]);
  };

  const handleRemove = (reference: IEntityReference) => {
    onChange?.(value.filter((item) => !isSameReference(item, reference)));
  };

  return (
    <div className="flex flex-col gap-3">
      <Label component="span" sx={{ margin: 0 }}>
        Talentos
      </Label>

      {!readOnly && (
        <SecondaryButton
          type="button"
          onClick={() => setIsModalOpen(true)}
          sx={{ alignSelf: 'flex-start' }}
        >
          Adicionar Talentos
        </SecondaryButton>
      )}

      <Tabs
        value={activeTabIndex}
        onChange={(_event, newValue: number) => setActiveTabIndex(newValue)}
        sx={{
          borderBottom: `1px solid ${APP_COLORS.gold}`,
          '& .MuiTab-root': { color: APP_COLORS.textBrownDark },
          '& .Mui-selected': { color: `${APP_COLORS.goldDark} !important` },
          '& .MuiTabs-indicator': { backgroundColor: APP_COLORS.goldDark },
        }}
      >
        {RACE_TALENTS_LEVEL_TABS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {filteredValue.length > 0 && (
        <div className="flex flex-col gap-2">
          {filteredValue.map((reference) =>
            readOnly ? (
              <EntityReferenceCard
                key={`${reference.entityType}-${reference.id}`}
                reference={reference}
              />
            ) : (
              <EntityReferenceCard
                key={`${reference.entityType}-${reference.id}`}
                reference={reference}
                onRemove={() => handleRemove(reference)}
              />
            ),
          )}
        </div>
      )}

      {filteredValue.length === 0 && (
        <DefaultText>Nenhum item adicionado.</DefaultText>
      )}

      {!readOnly && (
        <EntityReferenceSelectionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Adicionar Talentos"
          excludeReferences={value}
          onSelect={handleSelect}
          tabs={[{ label: 'Talentos', entityType: 'talent', url: '/talents' }]}
        />
      )}
    </div>
  );
};
