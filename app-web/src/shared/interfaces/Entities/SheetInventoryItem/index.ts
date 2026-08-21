import { ISheet } from '../Sheet';
import { IUtility } from '../Utility';
import { IConsumable } from '../Consumable';
import { IMaterial } from '../Material';
import { IAmmunition } from '../Ammunition';
import { IWeapon } from '../Weapon';
import { IArmor } from '../Armor';
import { IAccessory } from '../Accessory';
import { IShield } from '../Shield';

/**
 * As 8 categorias de item de inventário — mesmos valores do enum
 * `SheetInventoryItemCategory` do backend
 * (`app-api/src/modules/sheets/enums/sheet-inventory-item-category.enum.ts`).
 */
export type ISheetInventoryItemCategory =
  | 'utility'
  | 'consumable'
  | 'material'
  | 'ammunition'
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'shield';

/**
 * Snapshot completo de um item de inventário, no formato de campos já
 * exposto hoje pela interface de catálogo correspondente à categoria (sem
 * `id`/`createdAt`/`updatedAt`, já que o item de inventário não tem vínculo
 * vivo com o registro de catálogo de origem) — reaproveita as 8 interfaces
 * de catálogo já existentes em vez de criar 8 tipos novos.
 */
export type ISheetInventoryItemSnapshot =
  | Omit<IUtility, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<IConsumable, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<IMaterial, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<IAmmunition, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<IWeapon, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<IArmor, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<IAccessory, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<IShield, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Um card de item do inventário da ficha —
 * `SheetInventoryItemResponseDto` no backend. O campo `data` é o nome real
 * do snapshot no contrato (não `snapshot`, como assumido no planejamento
 * inicial da task antes do backend existir).
 */
export interface ISheetInventoryItem {
  id: string;
  category: ISheetInventoryItemCategory;
  quantity: number;
  equipped: boolean;
  unitVolume: number;
  data: ISheetInventoryItemSnapshot;
  createdAt: string;
  updatedAt: string;
}

/**
 * `SheetInventoryListResponseDto` no backend — retorno de
 * `GET /sheets/:id/inventory-items`.
 */
export interface ISheetInventoryList {
  counts: Record<ISheetInventoryItemCategory, number>;
  items: ISheetInventoryItem[];
}

/**
 * `SheetInventoryMutationResponseDto` no backend — retorno de todas as
 * mutações de inventário (adicionar/remover/equipar/desequipar).
 */
export interface ISheetInventoryMutationResult {
  sheet: ISheet;
  inventory: ISheetInventoryList;
}
