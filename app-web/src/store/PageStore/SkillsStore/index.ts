import { create } from 'zustand';
import { ISkillListItem } from '@/shared/interfaces';

interface SelectedSkillState {
  selectedSkill: ISkillListItem | null;
  setSelectedSkill: (skill: ISkillListItem) => void;
  resetSelectedSkill: () => void;
}

const INITIAL_STATE: Pick<SelectedSkillState, 'selectedSkill'> = {
  selectedSkill: null,
};

export const useSelectedSkillStore = create<SelectedSkillState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedSkill: (skill) => set({ selectedSkill: skill }),
  resetSelectedSkill: () => set(INITIAL_STATE),
}));
