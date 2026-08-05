export interface SheetProficiencySnapshotEntry {
  id: string;
  property: { id: string; name: string };
  gradation: { id: string; name: string; level: number };
  sourceName: string;
}

export interface SheetProficiencySnapshot {
  race: SheetProficiencySnapshotEntry[];
  biography: SheetProficiencySnapshotEntry[];
  trainings: SheetProficiencySnapshotEntry[];
  talents: SheetProficiencySnapshotEntry[];
  characteristics: SheetProficiencySnapshotEntry[];
}
