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

/**
 * Comparador reaproveitável para ordenar qualquer lista de itens nomeados
 * conforme `SHEET_ATTRIBUTE_PROPERTY_ORDER` (ex.: propriedades de
 * melhoria/defeito do tipo "Atributo" e as opções de `GET /attributes`) —
 * evita duplicar a mesma comparação por `indexOf` em mais de um `useMemo`.
 */
export const sortByAttributeOrder = <T extends { name: string }>(
  a: T,
  b: T,
) =>
  SHEET_ATTRIBUTE_PROPERTY_ORDER.indexOf(
    a.name as (typeof SHEET_ATTRIBUTE_PROPERTY_ORDER)[number],
  ) -
  SHEET_ATTRIBUTE_PROPERTY_ORDER.indexOf(
    b.name as (typeof SHEET_ATTRIBUTE_PROPERTY_ORDER)[number],
  );

/**
 * Definições fixas dos 3 Salvamentos (Fortitude, Reflexo, Vontade), cada um
 * com seu atributo-chave fixo, não editável pelo usuário — ver
 * `.claude/tasks/ficha-classe-armadura-salvamentos/spec.md`.
 */
export const SHEET_SAVING_THROW_DEFINITIONS = [
  { id: 'fortitude', name: 'Fortitude', keyAttributeName: 'Constituição' },
  { id: 'reflexo', name: 'Reflexo', keyAttributeName: 'Destreza' },
  { id: 'vontade', name: 'Vontade', keyAttributeName: 'Sabedoria' },
] as const;

/**
 * Atributo-chave fixo (não editável pelo usuário) do PV máximo — seu
 * modificador entra na fórmula `(PV da raça + modificador) * nível`.
 */
export const SHEET_HIT_POINTS_KEY_ATTRIBUTE_NAME = 'Constituição';

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

/**
 * Achata um snapshot de saberes (`ISheetKnowledgeSnapshot`) em uma única
 * lista, unindo as 5 origens — mesmo espírito de `flattenProficiencySnapshot`.
 * Reaproveitado tanto pela renderização de `SheetKnowledgesPanel` quanto pelo
 * cálculo de modificador de saber (`useSheetKnowledgeModifiers`).
 */
export const flattenKnowledgeSnapshot = (
  snapshot: ISheetKnowledgeSnapshot,
) => [
  ...snapshot.race,
  ...snapshot.biography,
  ...snapshot.trainings,
  ...snapshot.talents,
  ...snapshot.characteristics,
];
