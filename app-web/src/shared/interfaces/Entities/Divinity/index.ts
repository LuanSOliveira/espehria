import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface IDivinityCategory {
  id: string;
  name: string;
}

export interface IDivinityListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  category: IDivinityCategory;
  tags: ITag[];
}

export interface IDivinity extends IEntity {
  name: string;
  category: IDivinityCategory;
  referenceImage?: string | null;
  description?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface IDivinityListFilters {
  name?: string;
  categoryId?: string;
  page?: number;
  perPage?: number;
}
