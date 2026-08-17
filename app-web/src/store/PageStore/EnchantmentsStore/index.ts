import { create } from 'zustand';
import { IEnchantmentListItem } from '@/shared/interfaces';

interface SelectedEnchantmentState {
  selectedEnchantment: IEnchantmentListItem | null;
  setSelectedEnchantment: (enchantment: IEnchantmentListItem) => void;
  resetSelectedEnchantment: () => void;
}

const INITIAL_STATE: Pick<SelectedEnchantmentState, 'selectedEnchantment'> = {
  selectedEnchantment: null,
};

export const useSelectedEnchantmentStore = create<SelectedEnchantmentState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedEnchantment: (enchantment) =>
      set({ selectedEnchantment: enchantment }),
    resetSelectedEnchantment: () => set(INITIAL_STATE),
  }),
);
