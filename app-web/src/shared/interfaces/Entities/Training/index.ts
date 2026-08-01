import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';

export interface ITraining extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  improvedFrom: IEntityReference[];
  requirements: IEntityReference[];
  additionalAbilities: IEntityReference[];
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
