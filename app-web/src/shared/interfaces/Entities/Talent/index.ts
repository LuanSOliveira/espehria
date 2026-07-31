import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface ITalent extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface ITalentListItem {
  id: string;
  name: string;
  tags: ITag[];
}

export interface ITalentListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
