import { create } from 'zustand';
import { ITalentListItem } from '@/shared/interfaces';

interface SelectedTalentState {
  selectedTalent: ITalentListItem | null;
  setSelectedTalent: (talent: ITalentListItem) => void;
  resetSelectedTalent: () => void;
}

const INITIAL_STATE: Pick<SelectedTalentState, 'selectedTalent'> = {
  selectedTalent: null,
};

export const useSelectedTalentStore = create<SelectedTalentState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedTalent: (talent) => set({ selectedTalent: talent }),
  resetSelectedTalent: () => set(INITIAL_STATE),
}));
