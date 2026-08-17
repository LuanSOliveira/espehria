'use client';

import { useState } from 'react';
import { Control } from 'react-hook-form';
import { Tab, Tabs } from '@mui/material';
import { WeaponFormData } from '@/shared/formSchemas';
import { APP_COLORS } from '@/shared/constants';
import { WeaponEmbeddedEffectsTabPanel } from './WeaponEmbeddedEffectsTabPanel';

export interface WeaponEmbeddedEffectsFieldProps {
  control: Control<WeaponFormData>;
}

interface WeaponEmbeddedEffectTabConfig {
  fieldName: 'enchantments' | 'enhancements';
  tabLabel: string;
  entityLabel: string;
  entityUrl: '/enchantments' | '/enhancements';
  addButtonLabel: string;
}

const WEAPON_EMBEDDED_EFFECT_TABS: WeaponEmbeddedEffectTabConfig[] = [
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

export const WeaponEmbeddedEffectsField = ({
  control,
}: WeaponEmbeddedEffectsFieldProps) => {
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
        {WEAPON_EMBEDDED_EFFECT_TABS.map((tab) => (
          <Tab key={tab.fieldName} label={tab.tabLabel} />
        ))}
      </Tabs>

      {WEAPON_EMBEDDED_EFFECT_TABS.map((tab, index) => (
        <WeaponEmbeddedEffectsTabPanel
          key={tab.fieldName}
          control={control}
          active={activeTabIndex === index}
          fieldName={tab.fieldName}
          entityLabel={tab.entityLabel}
          entityUrl={tab.entityUrl}
          addButtonLabel={tab.addButtonLabel}
        />
      ))}
    </div>
  );
};
