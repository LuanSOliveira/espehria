import { IEntity } from '../Entity';

export interface ICreatureCategory {
  id: string;
  name: string;
}

export interface ICreatureListItem {
  id: string;
  referenceImageUrl?: string | null;
  name: string;
  category: ICreatureCategory;
}

export interface ICreature extends IEntity {
  name: string;
  referenceImageUrl?: string | null;
  otherNames?: string | null;
  category: ICreatureCategory;
  threatLevel?: string | null;
  averageLifeExpectancy?: string | null;
  physicalCharacteristics: string;
  habitat?: string | null;
  behavior?: string | null;
  diet?: string | null;
  lifeCycle?: string | null;
  lifeStageInfant?: string | null;
  lifeStageYoung?: string | null;
  lifeStageAdult?: string | null;
  lifeStageElder?: string | null;
  abilitiesAndPowers?: string | null;
  resistances?: string | null;
  weaknesses?: string | null;
  combat?: string | null;
  attackMethods?: string | null;
  strategy?: string | null;
  dangerDegree?: string | null;
  obtainedResources?: string | null;
  commercialValue?: string | null;
  relationWithCivilizations?: string | null;
  mythologyAndFolklore?: string | null;
  encounterRecord?: string | null;
  scholarsCuriosity?: string | null;
}

export interface ICreatureListFilters {
  name?: string;
  categoryId?: string;
  page?: number;
  perPage?: number;
}
