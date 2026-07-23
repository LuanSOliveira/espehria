import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface IRaceCategory {
  id: string;
  name: string;
}

export interface IRaceListItem {
  id: string;
  referenceImageUrl?: string | null;
  name: string;
  category: IRaceCategory;
  tags: ITag[];
}

export interface IRace extends IEntity {
  name: string;
  category: IRaceCategory;
  referenceImageUrl?: string | null;
  physicalCharacteristics?: string | null;
  description?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface IRaceListFilters {
  name?: string;
  categoryId?: string;
  page?: number;
  perPage?: number;
}
