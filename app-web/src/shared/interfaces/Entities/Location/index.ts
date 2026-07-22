import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface ILocationSummary {
  id: string;
  name: string;
  referenceImageUrl?: string | null;
}

export interface ILocationListItem {
  id: string;
  referenceImageUrl?: string | null;
  name: string;
  type?: string | null;
  tags: ITag[];
}

export interface ILocation extends IEntity {
  name: string;
  type?: string | null;
  referenceImageUrl?: string | null;
  description?: string | null;
  tags: ITag[];
  pointsOfInterest: ILocationSummary[];
  pointsOfInterestOf: ILocationSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ILocationListFilters {
  name?: string;
  type?: string;
  page?: number;
  perPage?: number;
}
