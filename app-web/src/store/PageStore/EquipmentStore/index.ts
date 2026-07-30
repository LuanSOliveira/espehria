import { create } from 'zustand';
import { IEquipmentListItem } from '@/shared/interfaces';

interface SelectedEquipmentState {
  selectedEquipment: IEquipmentListItem | null;
  setSelectedEquipment: (equipment: IEquipmentListItem) => void;
  resetSelectedEquipment: () => void;
}

const INITIAL_STATE: Pick<SelectedEquipmentState, 'selectedEquipment'> = {
  selectedEquipment: null,
};

export const useSelectedEquipmentStore = create<SelectedEquipmentState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedEquipment: (equipment) =>
      set({ selectedEquipment: equipment }),
    resetSelectedEquipment: () => set(INITIAL_STATE),
  }),
);
