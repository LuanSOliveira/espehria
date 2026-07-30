import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface IConditionSection {
  id: string;
  label: string;
  description?: string | null;
  order: number;
}

export interface ICondition extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  sections: IConditionSection[];
  createdAt: string;
  updatedAt: string;
}

export interface IConditionListItem {
  id: string;
  name: string;
}

export interface IConditionListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
