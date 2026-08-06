export interface SheetKnowledgeSnapshotEntry {
  id: string;
  title: string;
  gradation: { id: string; name: string; level: number };
  sourceName: string;
}

export interface SheetKnowledgeSnapshot {
  race: SheetKnowledgeSnapshotEntry[];
  biography: SheetKnowledgeSnapshotEntry[];
  trainings: SheetKnowledgeSnapshotEntry[];
  talents: SheetKnowledgeSnapshotEntry[];
  characteristics: SheetKnowledgeSnapshotEntry[];
}
