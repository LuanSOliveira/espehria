export interface SheetImprovementFlawSnapshotEntry {
  id: string | null;
  value: number;
  type: { id: string; name: string };
  property: { id: string; name: string };
  sourceName: string;
}

export interface SheetImprovementFlawSnapshot {
  race: SheetImprovementFlawSnapshotEntry[];
  biography: SheetImprovementFlawSnapshotEntry[];
  trainings: SheetImprovementFlawSnapshotEntry[];
  talents: SheetImprovementFlawSnapshotEntry[];
  characteristics: SheetImprovementFlawSnapshotEntry[];
}
