import { create } from 'zustand';
import { IDivinityListItem } from '@/shared/interfaces';

interface SelectedDivinityState {
  selectedDivinity: IDivinityListItem | null;
  setSelectedDivinity: (divinity: IDivinityListItem) => void;
  resetSelectedDivinity: () => void;
}

const INITIAL_STATE: Pick<SelectedDivinityState, 'selectedDivinity'> = {
  selectedDivinity: null,
};

export const useSelectedDivinityStore = create<SelectedDivinityState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedDivinity: (divinity) => set({ selectedDivinity: divinity }),
    resetSelectedDivinity: () => set(INITIAL_STATE),
  }),
);
