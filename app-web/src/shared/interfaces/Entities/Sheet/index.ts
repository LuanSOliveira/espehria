import { IEntity } from '../Entity';
import { IRaceListItem } from '../Race';
import { IBiographyListItem } from '../Biography';
import { IImprovementDefectItem } from '../ImprovementDefectItem';
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

export interface ISheet extends IEntity {
  name: string;
  referenceImage?: string | null;
  level: number;
  campaign?: { id: string; name: string } | null;
  race?: IRaceListItem | null;
  biography?: IBiographyListItem | null;
  melhorias: ISheetImprovementDefectSnapshot;
  defeitos: ISheetImprovementDefectSnapshot;
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
