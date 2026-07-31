import { create } from 'zustand';
import { IPlannedSessionListItem } from '@/shared/interfaces';

interface SelectedPlannedSessionState {
  selectedPlannedSession: IPlannedSessionListItem | null;
  setSelectedPlannedSession: (
    plannedSession: IPlannedSessionListItem,
  ) => void;
  resetSelectedPlannedSession: () => void;
}

const INITIAL_STATE: Pick<
  SelectedPlannedSessionState,
  'selectedPlannedSession'
> = {
  selectedPlannedSession: null,
};

export const useSelectedPlannedSessionStore =
  create<SelectedPlannedSessionState>()((set) => ({
    ...INITIAL_STATE,
    setSelectedPlannedSession: (plannedSession) =>
      set({ selectedPlannedSession: plannedSession }),
    resetSelectedPlannedSession: () => set(INITIAL_STATE),
  }));
