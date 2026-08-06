'use client';

import { useMemo } from 'react';
import {
  IProficiencyGradation,
  ISheetKnowledgeSnapshotEntry,
} from '@/shared/interfaces';
import {
  SheetSkillModifierAttribute,
  SheetSkillModifierBreakdownEntry,
} from '../useSheetSkillModifiers';

const KNOWLEDGE_KEY_ATTRIBUTE_NAME = 'Inteligência';

export interface SheetKnowledgeModifierResult {
  id: string;
  title: string;
  gradationName: string;
  sourceName: string;
  editable: boolean;
  note: string | null;
  total: number;
  breakdown: SheetSkillModifierBreakdownEntry[];
}

export interface UseSheetKnowledgeModifiersParams {
  entries: ISheetKnowledgeSnapshotEntry[];
  attributes: SheetSkillModifierAttribute[];
  gradations: IProficiencyGradation[];
}

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Calcula o modificador final de cada saber da ficha: bônus da graduação já
 * resolvida no próprio snapshot + modificador do atributo "Inteligência"
 * (regra fixa). Irmão de `useSheetSkillModifiers`, não generalizado com ele —
 * saber não tem a etapa de "achar a graduação vencedora entre
 * proficiencias/proficienciasAjustadas", já vem com a graduação resolvida.
 */
export const useSheetKnowledgeModifiers = ({
  entries,
  attributes,
  gradations,
}: UseSheetKnowledgeModifiersParams): SheetKnowledgeModifierResult[] => {
  return useMemo(() => {
    const matchedAttribute = attributes.find(
      (attribute) =>
        normalize(attribute.label) === normalize(KNOWLEDGE_KEY_ATTRIBUTE_NAME),
    );
    const attributeModifier = matchedAttribute?.modifier ?? 0;

    return entries.map((entry) => {
      const gradationBonus =
        gradations.find((gradation) => gradation.id === entry.gradation.id)
          ?.bonus ?? 0;

      const total = attributeModifier + gradationBonus;

      return {
        id: entry.id,
        title: entry.title,
        gradationName: entry.gradation.name,
        sourceName: entry.sourceName,
        editable: entry.editable,
        note: entry.note,
        total,
        breakdown: [
          { label: KNOWLEDGE_KEY_ATTRIBUTE_NAME, value: attributeModifier },
          {
            label: `Graduação ${entry.gradation.name}`,
            value: gradationBonus,
          },
        ],
      };
    });
  }, [entries, attributes, gradations]);
};
