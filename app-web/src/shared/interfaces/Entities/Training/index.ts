import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';
import { IImprovementDefectItem } from '../ImprovementDefectItem';

export interface ITraining extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  improvedFrom: IEntityReference[];
  requirements: IEntityReference[];
  additionalAbilities: IEntityReference[];
  improvements: IImprovementDefectItem[];
  flaws: IImprovementDefectItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ITrainingListItem {
  id: string;
  name: string;
  tags: ITag[];
}

export interface ITrainingListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
