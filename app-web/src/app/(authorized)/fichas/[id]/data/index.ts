import {
  ISheetImprovementDefectSnapshot,
  ISheetKnowledgeSnapshot,
  ISheetProficiencySnapshot,
} from '@/shared/interfaces';

/**
 * Ordem de exibição dos 6 atributos na aba Estatísticas, conforme wireframe
 * (`template-estatisticas.png`). A API ordena as propriedades por nome (ASC),
 * então a ordenação canônica é aplicada no frontend a partir desta lista.
 */
export const SHEET_ATTRIBUTE_PROPERTY_ORDER = [
  'Força',
  'Destreza',
  'Constituição',
  'Inteligência',
  'Sabedoria',
  'Carisma',
] as const;

export type SheetImprovementDefectCategoryKey =
  keyof ISheetImprovementDefectSnapshot;

export interface SheetImprovementDefectCategoryConfig {
  key: SheetImprovementDefectCategoryKey;
  label: string;
}

/**
 * Categorias de origem de `melhorias`/`defeitos` da ficha, com o label pt-BR
 * usado tanto nos accordions das abas Melhorias/Defeitos quanto no modal de
 * detalhes de atributos.
 */
export const SHEET_IMPROVEMENT_DEFECT_CATEGORIES: SheetImprovementDefectCategoryConfig[] =
  [
    { key: 'race', label: 'Raça' },
    { key: 'biography', label: 'Biografia' },
    { key: 'trainings', label: 'Treinamentos' },
    { key: 'talents', label: 'Talentos' },
    { key: 'characteristics', label: 'Características' },
  ];

export const SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT: ISheetImprovementDefectSnapshot =
  {
    race: [],
    biography: [],
    trainings: [],
    talents: [],
    characteristics: [],
  };

export const SHEET_EMPTY_PROFICIENCY_SNAPSHOT: ISheetProficiencySnapshot = {
  race: [],
  biography: [],
  trainings: [],
  talents: [],
  characteristics: [],
};

export const SHEET_EMPTY_KNOWLEDGE_SNAPSHOT: ISheetKnowledgeSnapshot = {
  race: [],
  biography: [],
  trainings: [],
  talents: [],
  characteristics: [],
};

/**
 * Achata um snapshot de proficiências (`ISheetProficiencySnapshot`) em uma
 * única lista, unindo as 5 origens (`race`, `biography`, `trainings`,
 * `talents`, `characteristics`). Reaproveitado tanto pela renderização da
 * aba Bônus > Proficiências quanto pelo cálculo de modificador de perícia
 * (`useSheetSkillModifiers`).
 */
export const flattenProficiencySnapshot = (
  snapshot: ISheetProficiencySnapshot,
) => [
  ...snapshot.race,
  ...snapshot.biography,
  ...snapshot.trainings,
  ...snapshot.talents,
  ...snapshot.characteristics,
];
