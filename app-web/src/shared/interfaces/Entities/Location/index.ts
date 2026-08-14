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

export interface ILocationSection {
  id: string;
  label: string;
  description?: string | null;
  order: number;
}

export interface ILocation extends IEntity {
  name: string;
  type?: string | null;
  referenceImageUrl?: string | null;
  description?: string | null;
  privateInformation?: string | null;
  tags: ITag[];
  pointsOfInterest: ILocationSummary[];
  pointsOfInterestOf: ILocationSummary[];
  sections: ILocationSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ILocationListFilters {
  name?: string;
  type?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
