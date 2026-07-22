import { create } from 'zustand';
import { ILocationListItem } from '@/shared/interfaces';

interface SelectedLocationState {
  selectedLocation: ILocationListItem | null;
  setSelectedLocation: (location: ILocationListItem) => void;
  resetSelectedLocation: () => void;
}

const INITIAL_STATE: Pick<SelectedLocationState, 'selectedLocation'> = {
  selectedLocation: null,
};

export const useSelectedLocationStore = create<SelectedLocationState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedLocation: (location) => set({ selectedLocation: location }),
    resetSelectedLocation: () => set(INITIAL_STATE),
  }),
);
