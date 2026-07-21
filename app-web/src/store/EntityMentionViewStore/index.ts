import { create } from 'zustand';

export interface EntityMentionPendingView {
  entityType: string;
  entityId: string;
}

interface EntityMentionViewState {
  pendingView: EntityMentionPendingView | null;
  openEntityView: (entityType: string, entityId: string) => void;
  closeEntityView: () => void;
}

export const useEntityMentionViewStore = create<EntityMentionViewState>()(
  (set) => ({
    pendingView: null,
    openEntityView: (entityType, entityId) =>
      set({ pendingView: { entityType, entityId } }),
    closeEntityView: () => set({ pendingView: null }),
  }),
);
