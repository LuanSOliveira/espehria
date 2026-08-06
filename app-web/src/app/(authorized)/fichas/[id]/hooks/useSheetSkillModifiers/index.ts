'use client';

import { useMemo } from 'react';
import {
  IProficiencyGradation,
  ISheetProficiencyAdjustmentEntry,
  ISheetProficiencySnapshot,
  ISkillListItem,
} from '@/shared/interfaces';
import { flattenProficiencySnapshot } from '../../data';

const DESTREINADO_GRADATION_NAME = 'Destreinado';

export interface SheetSkillModifierAttribute {
  label: string;
  value: number;
  modifier: number;
}

export interface SheetSkillModifierBreakdownEntry {
  label: string;
  value: number;
}

export interface SheetSkillModifierResult {
  id: string;
  name: string;
  keyAttributeName: string;
  gradationName: string;
  total: number;
  breakdown: SheetSkillModifierBreakdownEntry[];
}

export interface UseSheetSkillModifiersParams {
  skills: ISkillListItem[];
  attributes: SheetSkillModifierAttribute[];
  proficiencias: ISheetProficiencySnapshot;
  proficienciasAjustadas: ISheetProficiencyAdjustmentEntry[];
  gradations: IProficiencyGradation[];
}

const normalize = (value: string) => value.trim().toLowerCase();

interface MatchedGradation {
  gradationId: string;
  gradationName: string;
  level: number;
}

/**
 * Calcula o modificador final de cada perícia da ficha, 100% no client, a
 * partir dos dados brutos já carregados (`attributes`, `proficiencias`,
 * `proficienciasAjustadas`, `gradations`) — regra fechada com o usuário, ver
 * `.claude/tasks/ficha-pericias/task-web.md`.
 */
export const useSheetSkillModifiers = ({
  skills,
  attributes,
  proficiencias,
  proficienciasAjustadas,
  gradations,
}: UseSheetSkillModifiersParams): SheetSkillModifierResult[] => {
  return useMemo(() => {
    const destreinadoGradation = gradations.find(
      (gradation) =>
        normalize(gradation.name) === normalize(DESTREINADO_GRADATION_NAME),
    );

    const proficiencyEntries = flattenProficiencySnapshot(proficiencias);

    return skills.map((skill) => {
      const matchedAttribute = attributes.find(
        (attribute) =>
          normalize(attribute.label) === normalize(skill.keyAttribute.name),
      );
      const attributeModifier = matchedAttribute?.modifier ?? 0;
      const keyAttributeLabel = matchedAttribute?.label ?? skill.keyAttribute.name;

      const candidates: MatchedGradation[] = [];

      proficiencyEntries.forEach((entry) => {
        if (normalize(entry.property.name) === normalize(skill.name)) {
          candidates.push({
            gradationId: entry.gradation.id,
            gradationName: entry.gradation.name,
            level: entry.gradation.level,
          });
        }
      });

      proficienciasAjustadas.forEach((entry) => {
        if (
          entry.adjustedProperty &&
          normalize(entry.adjustedProperty.name) === normalize(skill.name)
        ) {
          candidates.push({
            gradationId: entry.originalGradation.id,
            gradationName: entry.originalGradation.name,
            level: entry.originalGradation.level,
          });
        }
      });

      const matchFound = candidates.length > 0;
      const winningCandidate = matchFound
        ? candidates.reduce((highest, current) =>
            current.level > highest.level ? current : highest,
          )
        : null;

      const winningGradationId =
        winningCandidate?.gradationId ?? destreinadoGradation?.id;
      const winningGradationName =
        winningCandidate?.gradationName ??
        destreinadoGradation?.name ??
        DESTREINADO_GRADATION_NAME;

      const gradationBonus =
        gradations.find((gradation) => gradation.id === winningGradationId)
          ?.bonus ?? 0;

      const total = attributeModifier + gradationBonus;

      return {
        id: skill.id,
        name: skill.name,
        keyAttributeName: skill.keyAttribute.name,
        gradationName: winningGradationName,
        total,
        breakdown: [
          { label: keyAttributeLabel, value: attributeModifier },
          {
            label: matchFound
              ? `Proficiência ${winningGradationName} em ${skill.name}`
              : winningGradationName,
            value: gradationBonus,
          },
        ],
      };
    });
  }, [skills, attributes, proficiencias, proficienciasAjustadas, gradations]);
};
