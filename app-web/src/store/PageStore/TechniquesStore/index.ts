import { create } from 'zustand';
import { ITechniqueListItem } from '@/shared/interfaces';

interface SelectedTechniqueState {
  selectedTechnique: ITechniqueListItem | null;
  setSelectedTechnique: (technique: ITechniqueListItem) => void;
  resetSelectedTechnique: () => void;
}

const INITIAL_STATE: Pick<SelectedTechniqueState, 'selectedTechnique'> = {
  selectedTechnique: null,
};

export const useSelectedTechniqueStore = create<SelectedTechniqueState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedTechnique: (technique) =>
      set({ selectedTechnique: technique }),
    resetSelectedTechnique: () => set(INITIAL_STATE),
  }),
);
