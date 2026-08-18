'use client';

import { useState } from 'react';
import { Control, FieldValues } from 'react-hook-form';
import { Tab, Tabs } from '@mui/material';
import { EquipmentApplicableType } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import { EmbeddedEffectsTabPanel } from './EmbeddedEffectsTabPanel';
import { EmbeddedEffectsFormShape } from './types';

export interface EmbeddedEffectsFieldProps<
  TFieldValues extends FieldValues & EmbeddedEffectsFormShape,
> {
  control: Control<TFieldValues>;
  applicableType: EquipmentApplicableType;
}

interface EmbeddedEffectTabConfig {
  fieldName: 'enchantments' | 'enhancements';
  tabLabel: string;
  entityLabel: string;
  entityUrl: '/enchantments' | '/enhancements';
  addButtonLabel: string;
}

const EMBEDDED_EFFECT_TABS: EmbeddedEffectTabConfig[] = [
  {
    fieldName: 'enchantments',
    tabLabel: 'Encantamentos',
    entityLabel: 'Encantamento',
    entityUrl: '/enchantments',
    addButtonLabel: 'Adicionar Encantamento',
  },
  {
    fieldName: 'enhancements',
    tabLabel: 'Aprimoramentos',
    entityLabel: 'Aprimoramento',
    entityUrl: '/enhancements',
    addButtonLabel: 'Adicionar Aprimoramento',
  },
];

export const EmbeddedEffectsField = <
  TFieldValues extends FieldValues & EmbeddedEffectsFormShape,
>({
  control,
  applicableType,
}: EmbeddedEffectsFieldProps<TFieldValues>) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  return (
    <div className="flex flex-col gap-4">
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
        {EMBEDDED_EFFECT_TABS.map((tab) => (
          <Tab key={tab.fieldName} label={tab.tabLabel} />
        ))}
      </Tabs>

      {EMBEDDED_EFFECT_TABS.map((tab, index) => (
        <EmbeddedEffectsTabPanel<TFieldValues>
          key={tab.fieldName}
          control={control}
          active={activeTabIndex === index}
          fieldName={tab.fieldName}
          entityLabel={tab.entityLabel}
          entityUrl={tab.entityUrl}
          addButtonLabel={tab.addButtonLabel}
          applicableType={applicableType}
        />
      ))}
    </div>
  );
};
