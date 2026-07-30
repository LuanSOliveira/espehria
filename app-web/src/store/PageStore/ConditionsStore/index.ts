import { create } from 'zustand';
import { IConditionListItem } from '@/shared/interfaces';

interface SelectedConditionState {
  selectedCondition: IConditionListItem | null;
  setSelectedCondition: (condition: IConditionListItem) => void;
  resetSelectedCondition: () => void;
}

const INITIAL_STATE: Pick<SelectedConditionState, 'selectedCondition'> = {
  selectedCondition: null,
};

export const useSelectedConditionStore = create<SelectedConditionState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedCondition: (condition) => set({ selectedCondition: condition }),
    resetSelectedCondition: () => set(INITIAL_STATE),
  }),
);
