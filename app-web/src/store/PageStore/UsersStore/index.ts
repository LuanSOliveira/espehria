import { create } from 'zustand';
import { IUser } from '@/shared/interfaces';

interface SelectedUserState {
  selectedUser: IUser | null;
  setSelectedUser: (user: IUser) => void;
  resetSelectedUser: () => void;
}

const INITIAL_STATE: Pick<SelectedUserState, 'selectedUser'> = {
  selectedUser: null,
};

export const useSelectedUserStore = create<SelectedUserState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedUser: (user) => set({ selectedUser: user }),
  resetSelectedUser: () => set(INITIAL_STATE),
}));
