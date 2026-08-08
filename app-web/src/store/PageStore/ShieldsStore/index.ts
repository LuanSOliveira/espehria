import { create } from 'zustand';
import { IShieldListItem } from '@/shared/interfaces';

interface SelectedShieldState {
  selectedShield: IShieldListItem | null;
  setSelectedShield: (shield: IShieldListItem) => void;
  resetSelectedShield: () => void;
}

const INITIAL_STATE: Pick<SelectedShieldState, 'selectedShield'> = {
  selectedShield: null,
};

export const useSelectedShieldStore = create<SelectedShieldState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedShield: (shield) => set({ selectedShield: shield }),
  resetSelectedShield: () => set(INITIAL_STATE),
}));
