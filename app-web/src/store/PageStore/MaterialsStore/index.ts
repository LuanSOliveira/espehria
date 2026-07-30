import { create } from 'zustand';
import { IMaterialListItem } from '@/shared/interfaces';

interface SelectedMaterialState {
  selectedMaterial: IMaterialListItem | null;
  setSelectedMaterial: (material: IMaterialListItem) => void;
  resetSelectedMaterial: () => void;
}

const INITIAL_STATE: Pick<SelectedMaterialState, 'selectedMaterial'> = {
  selectedMaterial: null,
};

export const useSelectedMaterialStore = create<SelectedMaterialState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedMaterial: (material) => set({ selectedMaterial: material }),
    resetSelectedMaterial: () => set(INITIAL_STATE),
  }),
);
