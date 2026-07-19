import { create } from 'zustand';
import { ICreatureListItem } from '@/shared/interfaces';

interface SelectedCreatureState {
  selectedCreature: ICreatureListItem | null;
  setSelectedCreature: (creature: ICreatureListItem) => void;
  resetSelectedCreature: () => void;
}

const INITIAL_STATE: Pick<SelectedCreatureState, 'selectedCreature'> = {
  selectedCreature: null,
};

export const useSelectedCreatureStore = create<SelectedCreatureState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedCreature: (creature) => set({ selectedCreature: creature }),
    resetSelectedCreature: () => set(INITIAL_STATE),
  }),
);
