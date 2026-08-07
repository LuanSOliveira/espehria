export type SheetProficiencyAdjustmentSourceType =
  'race' | 'biography' | 'training' | 'talent' | 'characteristic';

export interface SheetProficiencyAdjustment {
  id: string;
  sourceType: SheetProficiencyAdjustmentSourceType;
  sourceName: string;
  originalProperty: { id: string; name: string };
  originalGradation: { id: string; name: string; level: number };
  adjustedPropertyId: string | null;
  adjustedProperty: { id: string; name: string } | null;
}
