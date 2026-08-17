import { IEntity } from '../Entity';
import { EquipmentApplicableType } from '../EquipmentApplicableType';

export interface IEnchantmentListItem {
  id: string;
  name: string;
  type?: EquipmentApplicableType | null;
}

export interface IEnchantment extends IEntity {
  name: string;
  type?: EquipmentApplicableType | null;
  effect?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IEnchantmentListFilters {
  name?: string;
  type?: EquipmentApplicableType;
  page?: number;
  perPage?: number;
}
