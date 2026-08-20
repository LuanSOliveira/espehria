import { IEntity } from '../Entity';
import { IRaceListItem } from '../Race';
import { IBiographyListItem } from '../Biography';
import { ICharacteristicListItem } from '../Characteristic';
import { ITalentListItem } from '../Talent';
import { IEntityReference } from '../EntityReference';
import { ITag } from '../Tag';
import { IImprovementDefectItem } from '../ImprovementDefectItem';
import { IProficiencyProperty } from '../ProficiencyProperty';
import { IProficiencyGradation } from '../ProficiencyGradation';
import { IAttribute } from '../Attribute';
import { IUser } from '../User';

export interface ISheetListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  campaign?: { id: string; name: string } | null;
}

/**
 * Item de `melhorias`/`defeitos` da ficha: snapshot congelado no momento do
 * vínculo (não uma referência viva a `improvement_flaws`). `id` é nulo para a
 * melhoria de atributo livre criada ad-hoc no modal de Biografia.
 */
export interface ISheetImprovementDefectSnapshotEntry
  extends Omit<IImprovementDefectItem, 'id'> {
  id: string | null;
  sourceName: string;
}

export interface ISheetImprovementDefectSnapshot {
  race: ISheetImprovementDefectSnapshotEntry[];
  biography: ISheetImprovementDefectSnapshotEntry[];
  trainings: ISheetImprovementDefectSnapshotEntry[];
  talents: ISheetImprovementDefectSnapshotEntry[];
  characteristics: ISheetImprovementDefectSnapshotEntry[];
}

/**
 * Item de `proficiencias` da ficha: snapshot congelado no momento do vínculo
 * (não uma referência viva a `proficiencies`), já resolvido pela regra de
 * conflito de maior graduação — mesmo espírito de
 * ISheetImprovementDefectSnapshotEntry.
 */
export interface ISheetProficiencySnapshotEntry {
  id: string;
  property: IProficiencyProperty;
  gradation: IProficiencyGradation;
  sourceName: string;
}

export interface ISheetProficiencySnapshot {
  race: ISheetProficiencySnapshotEntry[];
  biography: ISheetProficiencySnapshotEntry[];
  trainings: ISheetProficiencySnapshotEntry[];
  talents: ISheetProficiencySnapshotEntry[];
  characteristics: ISheetProficiencySnapshotEntry[];
}

/**
 * Item de `saberes` da ficha: snapshot congelado no momento do vínculo (não
 * uma referência viva a `knowledges`) — mesmo espírito de
 * ISheetProficiencySnapshotEntry, porém sem regra de ajuste/conflito.
 */
export interface ISheetKnowledgeSnapshotEntry {
  id: string;
  title: string;
  gradation: IProficiencyGradation;
  sourceName: string;
  editable: boolean;
  note: string | null;
}

export interface ISheetKnowledgeSnapshot {
  race: ISheetKnowledgeSnapshotEntry[];
  biography: ISheetKnowledgeSnapshotEntry[];
  trainings: ISheetKnowledgeSnapshotEntry[];
  talents: ISheetKnowledgeSnapshotEntry[];
  characteristics: ISheetKnowledgeSnapshotEntry[];
}

export type ISheetProficiencyAdjustmentSourceType =
  | 'race'
  | 'biography'
  | 'training'
  | 'talent'
  | 'characteristic';

/**
 * Item de `proficienciasAjustadas`: uma proficiência recebida em conflito
 * (graduação menor ou igual à já existente para a mesma propriedade), à
 * espera (ou não) de uma propriedade substituta escolhida pelo usuário.
 */
export interface ISheetProficiencyAdjustmentEntry {
  id: string;
  sourceType: ISheetProficiencyAdjustmentSourceType;
  sourceName: string;
  originalProperty: IProficiencyProperty;
  originalGradation: IProficiencyGradation;
  adjustedProperty: IProficiencyProperty | null;
}

/**
 * `sheet.race` já vem populado hoje com `characteristics`/`talents` (via
 * `race.characteristics`/`race.talents`, sem passar por `entity_links` — Raça
 * não é dona de `additionalAbilities`), apesar de o tipo anterior não os
 * declarar — ver `.claude/tasks/ficha-habilidades/spec.md`, decisão de
 * investigação nº 1. Os dois campos usam o mesmo formato de item de listagem
 * já retornado por `GET /characteristics` e `GET /talents`
 * (`CharacteristicListItemResponseDto`/`TalentListItemResponseDto`: id, name,
 * level, tags — sem `entityType`, diferente de `IEntityReference`).
 */
export interface ISheetRace extends IRaceListItem {
  hitPoints: number;
  characteristics: ICharacteristicListItem[];
  talents: ITalentListItem[];
}

/**
 * `sheet.biography` expõe `additionalAbilities` (lista de Característica/
 * Treinamento/Talento concedidos pela biografia à ficha) — ver
 * `.claude/tasks/ficha-habilidades/task-api.md`, alteração em
 * `BiographyOptionResponseDto`.
 */
export interface ISheetBiography extends IBiographyListItem {
  additionalAbilities: IEntityReference[];
}

export interface ISheet extends IEntity {
  name: string;
  referenceImage?: string | null;
  level: number;
  campaign?: { id: string; name: string } | null;
  race?: ISheetRace | null;
  biography?: ISheetBiography | null;
  currentHitPoints: number | null;
  temporaryHitPoints: number | null;
  pc: number;
  pp: number;
  po: number;
  pl: number;
  loadedVolume: number;
  melhorias: ISheetImprovementDefectSnapshot;
  defeitos: ISheetImprovementDefectSnapshot;
  proficiencias: ISheetProficiencySnapshot;
  proficienciasAjustadas: ISheetProficiencyAdjustmentEntry[];
  saberes: ISheetKnowledgeSnapshot;
  armorClassKeyAttribute: IAttribute;
  createdBy: IUser;
  createdAt: string;
  updatedAt: string;
}

/**
 * Aba Habilidades da ficha (Características/Treinamentos/Talentos) — ver
 * `.claude/tasks/ficha-habilidades/`. Não é um campo de `ISheet`: é exposto
 * separadamente por `GET /sheets/:id/abilities` e devolvido junto com o
 * `ISheet` recalculado por cada mutação de habilidade
 * (`ISheetAbilitiesMutationResult`) — divergência confirmada contra o
 * contrato real do backend (`SheetResponseDto` não inclui `abilities`; ver
 * "Desvios" no `task-web.md`).
 */
export type ISheetAbilityBucketType = 'characteristic' | 'training' | 'talent';

/**
 * Tipo de entidade de origem de um item herdado. Inclui `'race'`, que não é
 * um `ReferenceableEntityType` (Raça não é referenciável via `entity_links`)
 * — mesmo tipo `SheetAbilityOriginEntityType` do backend
 * (`app-api/src/modules/sheets/dto/sheet-ability-origin-response.dto.ts`).
 */
export type ISheetAbilityOriginEntityType =
  | 'training'
  | 'talent'
  | 'technique'
  | 'spell'
  | 'characteristic'
  | 'biography'
  | 'race';

export interface ISheetAbilityOrigin {
  entityType: ISheetAbilityOriginEntityType;
  id: string;
  name: string;
}

export interface ISheetAbilityCard {
  id: string;
  name: string;
  level: number;
  tags: ITag[];
  requirementsMet: boolean;
  /** Preenchido apenas para itens herdados; nulo para slot ou extra. */
  origin: ISheetAbilityOrigin | null;
}

export interface ISheetTrainingSlot {
  slotIndex: number;
  unlockedAtLevel: number;
  training: ISheetAbilityCard | null;
}

export interface ISheetAbilitiesSummary {
  characteristics: {
    inherited: ISheetAbilityCard[];
    extras: ISheetAbilityCard[];
  };
  trainings: {
    slots: ISheetTrainingSlot[];
    inherited: ISheetAbilityCard[];
    extras: ISheetAbilityCard[];
  };
  talents: {
    inherited: ISheetAbilityCard[];
    extras: ISheetAbilityCard[];
  };
}

/**
 * Retorno de todas as mutações de habilidade (`POST/DELETE
 * .../extras`, `PUT/DELETE .../trainings/slots/:slotIndex/training`) —
 * `SheetAbilitiesMutationResponseDto` no backend.
 */
export interface ISheetAbilitiesMutationResult {
  sheet: ISheet;
  abilities: ISheetAbilitiesSummary;
}

export interface ISheetListFilters {
  name?: string;
  campaignId?: string;
  page?: number;
  perPage?: number;
}

export interface ISheetCampaignOption {
  id: string;
  name: string;
}
