import { FamilyClassification } from '@/shared/interfaces';

export interface FamilyClassificationOption {
  value: FamilyClassification;
  label: string;
}

export const FAMILY_CLASSIFICATION_OPTIONS: FamilyClassificationOption[] = [
  { value: 'royalty', label: 'Real' },
  { value: 'nobility', label: 'Nobreza' },
  { value: 'commoner', label: 'Plebe' },
];
