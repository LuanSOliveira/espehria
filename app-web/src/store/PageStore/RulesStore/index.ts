import { create } from 'zustand';
import { IRuleListItem } from '@/shared/interfaces';

interface SelectedRuleState {
  selectedRule: IRuleListItem | null;
  setSelectedRule: (rule: IRuleListItem) => void;
  resetSelectedRule: () => void;
}

const INITIAL_STATE: Pick<SelectedRuleState, 'selectedRule'> = {
  selectedRule: null,
};

export const useSelectedRuleStore = create<SelectedRuleState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedRule: (rule) => set({ selectedRule: rule }),
  resetSelectedRule: () => set(INITIAL_STATE),
}));
