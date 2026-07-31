import { create } from 'zustand';
import { ITrainingListItem } from '@/shared/interfaces';

interface SelectedTrainingState {
  selectedTraining: ITrainingListItem | null;
  setSelectedTraining: (training: ITrainingListItem) => void;
  resetSelectedTraining: () => void;
}

const INITIAL_STATE: Pick<SelectedTrainingState, 'selectedTraining'> = {
  selectedTraining: null,
};

export const useSelectedTrainingStore = create<SelectedTrainingState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedTraining: (training) => set({ selectedTraining: training }),
    resetSelectedTraining: () => set(INITIAL_STATE),
  }),
);
