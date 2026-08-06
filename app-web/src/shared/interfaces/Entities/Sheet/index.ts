import { IEntity } from '../Entity';
import { IRaceListItem } from '../Race';
import { IBiographyListItem } from '../Biography';
import { IImprovementDefectItem } from '../ImprovementDefectItem';
import { IProficiencyProperty } from '../ProficiencyProperty';
import { IProficiencyGradation } from '../ProficiencyGradation';
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

export interface ISheet extends IEntity {
  name: string;
  referenceImage?: string | null;
  level: number;
  campaign?: { id: string; name: string } | null;
  race?: IRaceListItem | null;
  biography?: IBiographyListItem | null;
  melhorias: ISheetImprovementDefectSnapshot;
  defeitos: ISheetImprovementDefectSnapshot;
  proficiencias: ISheetProficiencySnapshot;
  proficienciasAjustadas: ISheetProficiencyAdjustmentEntry[];
  saberes: ISheetKnowledgeSnapshot;
  createdBy: IUser;
  createdAt: string;
  updatedAt: string;
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
