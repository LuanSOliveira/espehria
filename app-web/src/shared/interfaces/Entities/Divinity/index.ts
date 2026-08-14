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
  titles?: string | null;
  alignment?: string | null;
  domainSphere?: string | null;
  primaryElement?: string | null;
  sacredSymbol?: string | null;
  sacredAnimal?: string | null;
  sacredColor?: string | null;
  personality?: string | null;
  divineDomains?: string | null;
  powers?: string | null;
  worldInfluence?: string | null;
  divineAppearance?: string | null;
  avatars?: string | null;
  church?: string | null;
  cult?: string | null;
  blessings?: string | null;
  curses?: string | null;
  legends?: string | null;
  commandments?: string | null;
  oaths?: string | null;
  curiosities?: string | null;
  privateInformation?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDivinityListFilters {
  name?: string;
  categoryId?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
