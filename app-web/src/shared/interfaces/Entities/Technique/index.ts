import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';

export interface ITechniqueListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  tags: ITag[];
  level: number;
}

export interface ITechnique extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  tags: ITag[];
  level: number;
  improvedFrom: IEntityReference[];
  requirements: IEntityReference[];
  createdAt: string;
  updatedAt: string;
}

export interface ITechniqueListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
