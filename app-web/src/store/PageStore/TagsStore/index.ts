import { create } from 'zustand';
import { ITag } from '@/shared/interfaces';

interface SelectedTagState {
  selectedTag: ITag | null;
  setSelectedTag: (tag: ITag) => void;
  resetSelectedTag: () => void;
}

const INITIAL_STATE: Pick<SelectedTagState, 'selectedTag'> = {
  selectedTag: null,
};

export const useSelectedTagStore = create<SelectedTagState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  resetSelectedTag: () => set(INITIAL_STATE),
}));
