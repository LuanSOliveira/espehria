import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';

export interface ITalent extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  level: number;
  improvedFrom: IEntityReference[];
  requirements: IEntityReference[];
  createdAt: string;
  updatedAt: string;
}

export interface ITalentListItem {
  id: string;
  name: string;
  tags: ITag[];
  level: number;
}

export interface ITalentListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
