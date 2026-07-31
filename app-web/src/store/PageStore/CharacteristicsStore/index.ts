import { create } from 'zustand';
import { ICharacteristicListItem } from '@/shared/interfaces';

interface SelectedCharacteristicState {
  selectedCharacteristic: ICharacteristicListItem | null;
  setSelectedCharacteristic: (characteristic: ICharacteristicListItem) => void;
  resetSelectedCharacteristic: () => void;
}

const INITIAL_STATE: Pick<
  SelectedCharacteristicState,
  'selectedCharacteristic'
> = {
  selectedCharacteristic: null,
};

export const useSelectedCharacteristicStore =
  create<SelectedCharacteristicState>()((set) => ({
    ...INITIAL_STATE,
    setSelectedCharacteristic: (characteristic) =>
      set({ selectedCharacteristic: characteristic }),
    resetSelectedCharacteristic: () => set(INITIAL_STATE),
  }));
