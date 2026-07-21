import { IEntity } from '../Entity';

export interface ITag extends IEntity {
  name: string;
  color: string;
}

export interface ITagListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
