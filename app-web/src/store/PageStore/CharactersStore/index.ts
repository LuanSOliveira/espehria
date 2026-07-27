import { create } from 'zustand';
import { ICharacterListItem } from '@/shared/interfaces';

interface SelectedCharacterState {
  selectedCharacter: ICharacterListItem | null;
  setSelectedCharacter: (character: ICharacterListItem) => void;
  resetSelectedCharacter: () => void;
}

const INITIAL_STATE: Pick<SelectedCharacterState, 'selectedCharacter'> = {
  selectedCharacter: null,
};

export const useSelectedCharacterStore = create<SelectedCharacterState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedCharacter: (character) => set({ selectedCharacter: character }),
    resetSelectedCharacter: () => set(INITIAL_STATE),
  }),
);
