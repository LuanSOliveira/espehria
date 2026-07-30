import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface IAmmunitionListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  tags: ITag[];
}

export interface IAmmunition extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  price?: string | null;
  privateInformation?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface IAmmunitionListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
