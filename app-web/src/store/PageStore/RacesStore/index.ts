import { create } from 'zustand';
import { IRaceListItem } from '@/shared/interfaces';

interface SelectedRaceState {
  selectedRace: IRaceListItem | null;
  setSelectedRace: (race: IRaceListItem) => void;
  resetSelectedRace: () => void;
}

const INITIAL_STATE: Pick<SelectedRaceState, 'selectedRace'> = {
  selectedRace: null,
};

export const useSelectedRaceStore = create<SelectedRaceState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedRace: (race) => set({ selectedRace: race }),
  resetSelectedRace: () => set(INITIAL_STATE),
}));
