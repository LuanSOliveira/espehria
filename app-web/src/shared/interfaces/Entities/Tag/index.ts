import { IEntity } from '../Entity';

export interface ITag extends IEntity {
  name: string;
  color: string;
  type?: string;
}

export interface ITagListFilters {
  name?: string;
  type?: string;
  page?: number;
  perPage?: number;
}
