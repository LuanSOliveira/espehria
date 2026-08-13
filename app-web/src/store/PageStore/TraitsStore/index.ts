import { create } from 'zustand';
import { ITraitListItem } from '@/shared/interfaces';

interface SelectedTraitState {
  selectedTrait: ITraitListItem | null;
  setSelectedTrait: (trait: ITraitListItem) => void;
  resetSelectedTrait: () => void;
}

const INITIAL_STATE: Pick<SelectedTraitState, 'selectedTrait'> = {
  selectedTrait: null,
};

export const useSelectedTraitStore = create<SelectedTraitState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedTrait: (trait) => set({ selectedTrait: trait }),
  resetSelectedTrait: () => set(INITIAL_STATE),
}));
