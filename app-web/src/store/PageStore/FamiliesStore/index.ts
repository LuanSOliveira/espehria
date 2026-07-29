import { create } from 'zustand';
import { IFamilyListItem } from '@/shared/interfaces';

interface SelectedFamilyState {
  selectedFamily: IFamilyListItem | null;
  setSelectedFamily: (family: IFamilyListItem) => void;
  resetSelectedFamily: () => void;
}

const INITIAL_STATE: Pick<SelectedFamilyState, 'selectedFamily'> = {
  selectedFamily: null,
};

export const useSelectedFamilyStore = create<SelectedFamilyState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedFamily: (family) => set({ selectedFamily: family }),
  resetSelectedFamily: () => set(INITIAL_STATE),
}));
