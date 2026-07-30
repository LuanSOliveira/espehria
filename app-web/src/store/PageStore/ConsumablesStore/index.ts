import { create } from 'zustand';
import { IConsumableListItem } from '@/shared/interfaces';

interface SelectedConsumableState {
  selectedConsumable: IConsumableListItem | null;
  setSelectedConsumable: (consumable: IConsumableListItem) => void;
  resetSelectedConsumable: () => void;
}

const INITIAL_STATE: Pick<SelectedConsumableState, 'selectedConsumable'> = {
  selectedConsumable: null,
};

export const useSelectedConsumableStore = create<SelectedConsumableState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedConsumable: (consumable) =>
      set({ selectedConsumable: consumable }),
    resetSelectedConsumable: () => set(INITIAL_STATE),
  }),
);
