import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEraSummary } from '../Era';

export interface IEventListItem {
  id: string;
  referenceImageUrl?: string | null;
  name: string;
  startYear?: number | null;
  endYear?: number | null;
  era: IEraSummary | null;
  tags: ITag[];
}

export interface IEvent extends IEntity {
  name: string;
  referenceImageUrl?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  description?: string | null;
  privateInformation?: string | null;
  era: IEraSummary | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface IEventListFilters {
  name?: string;
  eraId?: string;
  startYear?: number;
  endYear?: number;
  page?: number;
  perPage?: number;
}
