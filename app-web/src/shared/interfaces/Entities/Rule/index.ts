import { IEntity } from '../Entity';

export interface IRuleSection {
  id: string;
  label: string;
  description?: string | null;
  order: number;
}

export interface IRule extends IEntity {
  name: string;
  description?: string | null;
  sections: IRuleSection[];
  createdAt: string;
  updatedAt: string;
}

export interface IRuleListItem {
  id: string;
  name: string;
}

export interface IRuleListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
