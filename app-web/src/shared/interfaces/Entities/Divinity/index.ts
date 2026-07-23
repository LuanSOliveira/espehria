import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface IDivinityListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  tags: ITag[];
}

export interface IDivinity extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface IDivinityListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
