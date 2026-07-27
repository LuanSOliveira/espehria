import { ICharacterSummary } from '../Character';
import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface IOrganizationSummary {
  id: string;
  name: string;
  referenceImage?: string | null;
}

export interface IOrganizationMember {
  id: string;
  role: string;
  character: ICharacterSummary;
}

export interface IOrganizationListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  tags: ITag[];
}

export interface IOrganization extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  tags: ITag[];
  members: IOrganizationMember[];
  createdAt: string;
  updatedAt: string;
}

export interface IOrganizationListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
