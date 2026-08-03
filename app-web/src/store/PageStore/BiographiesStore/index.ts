import { create } from 'zustand';
import { IBiographyListItem } from '@/shared/interfaces';

interface SelectedBiographyState {
  selectedBiography: IBiographyListItem | null;
  setSelectedBiography: (biography: IBiographyListItem) => void;
  resetSelectedBiography: () => void;
}

const INITIAL_STATE: Pick<SelectedBiographyState, 'selectedBiography'> = {
  selectedBiography: null,
};

export const useSelectedBiographyStore = create<SelectedBiographyState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedBiography: (biography) =>
      set({ selectedBiography: biography }),
    resetSelectedBiography: () => set(INITIAL_STATE),
  }),
);
