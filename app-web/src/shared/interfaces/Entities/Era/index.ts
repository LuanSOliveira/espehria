import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface IEraOption {
  id: string;
  name: string;
  order: number;
}

export interface IEraSummary {
  id: string;
  name: string;
}

export interface IEraListItem {
  id: string;
  referenceImageUrl?: string | null;
  name: string;
  order: number;
  tags: ITag[];
}

export interface IEra extends IEntity {
  name: string;
  referenceImageUrl?: string | null;
  description?: string | null;
  order: number;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface IEraListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
