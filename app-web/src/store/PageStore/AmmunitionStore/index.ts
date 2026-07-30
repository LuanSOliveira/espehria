import { create } from 'zustand';
import { IAmmunitionListItem } from '@/shared/interfaces';

interface SelectedAmmunitionState {
  selectedAmmunition: IAmmunitionListItem | null;
  setSelectedAmmunition: (ammunition: IAmmunitionListItem) => void;
  resetSelectedAmmunition: () => void;
}

const INITIAL_STATE: Pick<SelectedAmmunitionState, 'selectedAmmunition'> = {
  selectedAmmunition: null,
};

export const useSelectedAmmunitionStore = create<SelectedAmmunitionState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedAmmunition: (ammunition) =>
      set({ selectedAmmunition: ammunition }),
    resetSelectedAmmunition: () => set(INITIAL_STATE),
  }),
);
