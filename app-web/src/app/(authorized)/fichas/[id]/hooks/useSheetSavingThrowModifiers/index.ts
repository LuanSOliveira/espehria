'use client';

import { useMemo } from 'react';
import {
  IProficiencyGradation,
  ISheetProficiencyAdjustmentEntry,
  ISheetProficiencySnapshot,
  ISkillListItem,
} from '@/shared/interfaces';
import { SHEET_SAVING_THROW_DEFINITIONS } from '../../data';
import {
  SheetSkillModifierAttribute,
  SheetSkillModifierResult,
  useSheetSkillModifiers,
} from '../useSheetSkillModifiers';

export interface UseSheetSavingThrowModifiersParams {
  attributes: SheetSkillModifierAttribute[];
  proficiencias: ISheetProficiencySnapshot;
  proficienciasAjustadas: ISheetProficiencyAdjustmentEntry[];
  gradations: IProficiencyGradation[];
}

/**
 * Adaptador fino: monta os 3 Salvamentos fixos como "pseudo-perícias"
 * (`ISkillListItem`-compatíveis, usando o próprio `id` fixo como placeholder
 * de `keyAttribute.id`, não usado no cálculo) e delega inteiramente para
 * `useSheetSkillModifiers`. Nenhuma lógica de cálculo é duplicada aqui — a
 * regra (casamento de atributo por nome + casamento de gradação por nome da
 * proficiência + fallback "Destreinado") continua vivendo exclusivamente em
 * `useSheetSkillModifiers`.
 */
export const useSheetSavingThrowModifiers = ({
  attributes,
  proficiencias,
  proficienciasAjustadas,
  gradations,
}: UseSheetSavingThrowModifiersParams): SheetSkillModifierResult[] => {
  const pseudoSkills = useMemo<ISkillListItem[]>(
    () =>
      SHEET_SAVING_THROW_DEFINITIONS.map((definition) => ({
        id: definition.id,
        name: definition.name,
        keyAttribute: { id: definition.id, name: definition.keyAttributeName },
      })),
    [],
  );

  return useSheetSkillModifiers({
    skills: pseudoSkills,
    attributes,
    proficiencias,
    proficienciasAjustadas,
    gradations,
  });
};
