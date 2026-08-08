import { create } from 'zustand';
import { IAccessoryListItem } from '@/shared/interfaces';

interface SelectedAccessoryState {
  selectedAccessory: IAccessoryListItem | null;
  setSelectedAccessory: (accessory: IAccessoryListItem) => void;
  resetSelectedAccessory: () => void;
}

const INITIAL_STATE: Pick<SelectedAccessoryState, 'selectedAccessory'> = {
  selectedAccessory: null,
};

export const useSelectedAccessoryStore = create<SelectedAccessoryState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedAccessory: (accessory) => set({ selectedAccessory: accessory }),
    resetSelectedAccessory: () => set(INITIAL_STATE),
  }),
);
