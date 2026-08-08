import { create } from 'zustand';
import { IWeaponListItem } from '@/shared/interfaces';

interface SelectedWeaponState {
  selectedWeapon: IWeaponListItem | null;
  setSelectedWeapon: (weapon: IWeaponListItem) => void;
  resetSelectedWeapon: () => void;
}

const INITIAL_STATE: Pick<SelectedWeaponState, 'selectedWeapon'> = {
  selectedWeapon: null,
};

export const useSelectedWeaponStore = create<SelectedWeaponState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedWeapon: (weapon) => set({ selectedWeapon: weapon }),
  resetSelectedWeapon: () => set(INITIAL_STATE),
}));
