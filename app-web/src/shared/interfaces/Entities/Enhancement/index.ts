import { IEntity } from '../Entity';
import { EquipmentApplicableType } from '../EquipmentApplicableType';

export interface IEnhancementListItem {
  id: string;
  name: string;
  type?: EquipmentApplicableType | null;
}

export interface IEnhancement extends IEntity {
  name: string;
  type?: EquipmentApplicableType | null;
  effect?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IEnhancementListFilters {
  name?: string;
  type?: EquipmentApplicableType;
  page?: number;
  perPage?: number;
}
