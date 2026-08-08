import { create } from 'zustand';
import { IArmorListItem } from '@/shared/interfaces';

interface SelectedArmorState {
  selectedArmor: IArmorListItem | null;
  setSelectedArmor: (armor: IArmorListItem) => void;
  resetSelectedArmor: () => void;
}

const INITIAL_STATE: Pick<SelectedArmorState, 'selectedArmor'> = {
  selectedArmor: null,
};

export const useSelectedArmorStore = create<SelectedArmorState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedArmor: (armor) => set({ selectedArmor: armor }),
  resetSelectedArmor: () => set(INITIAL_STATE),
}));
