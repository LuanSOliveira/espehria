import { EquipmentApplicableType } from '@/shared/interfaces';

export interface EquipmentApplicableTypeOption {
  value: EquipmentApplicableType;
  label: string;
}

export const EQUIPMENT_APPLICABLE_TYPE_OPTIONS: EquipmentApplicableTypeOption[] = [
  { value: 'weapon', label: 'Arma' },
  { value: 'armor', label: 'Armadura' },
  { value: 'shield', label: 'Escudo' },
  { value: 'accessory', label: 'Acessório' },
];

export const EQUIPMENT_APPLICABLE_TYPE_LABELS: Record<
  EquipmentApplicableType,
  string
> = {
  weapon: 'Arma',
  armor: 'Armadura',
  shield: 'Escudo',
  accessory: 'Acessório',
};
