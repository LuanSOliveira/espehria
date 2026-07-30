import { create } from 'zustand';
import { IUtilityListItem } from '@/shared/interfaces';

interface SelectedUtilityState {
  selectedUtility: IUtilityListItem | null;
  setSelectedUtility: (utility: IUtilityListItem) => void;
  resetSelectedUtility: () => void;
}

const INITIAL_STATE: Pick<SelectedUtilityState, 'selectedUtility'> = {
  selectedUtility: null,
};

export const useSelectedUtilityStore = create<SelectedUtilityState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedUtility: (utility) => set({ selectedUtility: utility }),
    resetSelectedUtility: () => set(INITIAL_STATE),
  }),
);
