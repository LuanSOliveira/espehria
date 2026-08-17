import { create } from 'zustand';
import { IEnhancementListItem } from '@/shared/interfaces';

interface SelectedEnhancementState {
  selectedEnhancement: IEnhancementListItem | null;
  setSelectedEnhancement: (enhancement: IEnhancementListItem) => void;
  resetSelectedEnhancement: () => void;
}

const INITIAL_STATE: Pick<SelectedEnhancementState, 'selectedEnhancement'> = {
  selectedEnhancement: null,
};

export const useSelectedEnhancementStore = create<SelectedEnhancementState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedEnhancement: (enhancement) =>
      set({ selectedEnhancement: enhancement }),
    resetSelectedEnhancement: () => set(INITIAL_STATE),
  }),
);
