import {
  ISheetAbilitiesSummary,
  ISheetAbilityOrigin,
  ISheetAbilityOriginEntityType,
  ISheetImprovementDefectSnapshot,
  ISheetInventoryItemCategory,
  ISheetKnowledgeSnapshot,
  ISheetProficiencySnapshot,
} from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

/**
 * Estilo compartilhado das `Tabs` da tela de ficha (abas principais e
 * sub-abas), usado tanto em `page.tsx` quanto em `SheetInventoryItemsSection`
 * (duas `Tabs` internas: Carregados/Equipados e, dentro delas, por
 * categoria).
 */
export const SHEET_TABS_SX = {
  borderBottom: `1px solid ${APP_COLORS.gold}`,
  '& .MuiTab-root': { color: APP_COLORS.textBrownDark },
  '& .Mui-selected': { color: `${APP_COLORS.goldDark} !important` },
  '& .MuiTabs-indicator': { backgroundColor: APP_COLORS.goldDark },
};

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

/**
 * Valor inicial da aba Habilidades, antes da primeira resposta de
 * `GET /sheets/:id/abilities` chegar — mesmo espírito de
 * `SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT`/`SHEET_EMPTY_PROFICIENCY_SNAPSHOT`/
 * `SHEET_EMPTY_KNOWLEDGE_SNAPSHOT`.
 */
export const SHEET_EMPTY_ABILITIES_SUMMARY: ISheetAbilitiesSummary = {
  characteristics: { inherited: [], extras: [] },
  trainings: { slots: [], inherited: [], extras: [] },
  talents: { inherited: [], extras: [] },
};

/**
 * Label pt-BR de cada tipo de entidade de origem possível de um item
 * herdado, usado para compor o indicativo textual "via {origem} {nome}"
 * exibido nos cards herdados das 3 sub-abas de Habilidades.
 */
export const SHEET_ABILITY_ORIGIN_LABELS: Record<
  ISheetAbilityOriginEntityType,
  string
> = {
  race: 'Raça',
  biography: 'Biografia',
  training: 'Treinamento',
  talent: 'Talento',
  characteristic: 'Característica',
  technique: 'Técnica',
  spell: 'Magia',
};

/**
 * Formata o indicativo textual de origem de um card herdado (ex.: "via Raça
 * Anão"), reaproveitado pelas 3 sub-abas de Habilidades.
 */
export const formatSheetAbilityOriginLabel = (origin: ISheetAbilityOrigin) =>
  `via ${SHEET_ABILITY_ORIGIN_LABELS[origin.entityType]} ${origin.name}`;

/**
 * Configuração fixa das 8 categorias de item de inventário (aba Inventário >
 * `SheetInventoryItemsSection`), na ordem de exibição em "Carregados" pedida
 * pelo `spec.md`. `equipable` marca as 4 categorias com ações de
 * Equipar/Desequipar (também a ordem de exibição em "Equipados", filtrando
 * esta mesma lista). `catalogEndpoint` é o endpoint de catálogo usado pelo
 * `Sheet<X>CatalogPickerModal`/`Sheet<X>StandaloneForm` de cada categoria.
 */
export interface SheetInventoryCategoryConfig {
  category: ISheetInventoryItemCategory;
  label: string;
  catalogEndpoint: string;
  equipable: boolean;
}

export const SHEET_INVENTORY_CATEGORIES: SheetInventoryCategoryConfig[] = [
  {
    category: 'utility',
    label: 'Utilitários',
    catalogEndpoint: '/utilities',
    equipable: false,
  },
  {
    category: 'consumable',
    label: 'Consumíveis',
    catalogEndpoint: '/consumables',
    equipable: false,
  },
  {
    category: 'material',
    label: 'Materiais',
    catalogEndpoint: '/materials',
    equipable: false,
  },
  {
    category: 'ammunition',
    label: 'Munições',
    catalogEndpoint: '/ammunition',
    equipable: false,
  },
  {
    category: 'weapon',
    label: 'Armas',
    catalogEndpoint: '/weapons',
    equipable: true,
  },
  {
    category: 'armor',
    label: 'Armaduras',
    catalogEndpoint: '/armors',
    equipable: true,
  },
  {
    category: 'accessory',
    label: 'Acessórios',
    catalogEndpoint: '/accessories',
    equipable: true,
  },
  {
    category: 'shield',
    label: 'Escudos',
    catalogEndpoint: '/shields',
    equipable: true,
  },
];

export const SHEET_INVENTORY_EQUIPABLE_CATEGORIES =
  SHEET_INVENTORY_CATEGORIES.filter((config) => config.equipable);
