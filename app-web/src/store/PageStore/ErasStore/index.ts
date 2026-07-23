import { create } from 'zustand';
import { IEraListItem } from '@/shared/interfaces';

interface SelectedEraState {
  selectedEra: IEraListItem | null;
  setSelectedEra: (era: IEraListItem) => void;
  resetSelectedEra: () => void;
}

const INITIAL_STATE: Pick<SelectedEraState, 'selectedEra'> = {
  selectedEra: null,
};

export const useSelectedEraStore = create<SelectedEraState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedEra: (era) => set({ selectedEra: era }),
  resetSelectedEra: () => set(INITIAL_STATE),
}));
