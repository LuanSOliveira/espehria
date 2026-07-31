import { create } from 'zustand';
import { ISpellListItem } from '@/shared/interfaces';

interface SelectedSpellState {
  selectedSpell: ISpellListItem | null;
  setSelectedSpell: (spell: ISpellListItem) => void;
  resetSelectedSpell: () => void;
}

const INITIAL_STATE: Pick<SelectedSpellState, 'selectedSpell'> = {
  selectedSpell: null,
};

export const useSelectedSpellStore = create<SelectedSpellState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedSpell: (spell) => set({ selectedSpell: spell }),
  resetSelectedSpell: () => set(INITIAL_STATE),
}));
