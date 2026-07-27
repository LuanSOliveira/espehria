import { create } from 'zustand';
import { IOrganizationListItem } from '@/shared/interfaces';

interface SelectedOrganizationState {
  selectedOrganization: IOrganizationListItem | null;
  setSelectedOrganization: (organization: IOrganizationListItem) => void;
  resetSelectedOrganization: () => void;
}

const INITIAL_STATE: Pick<SelectedOrganizationState, 'selectedOrganization'> = {
  selectedOrganization: null,
};

export const useSelectedOrganizationStore = create<SelectedOrganizationState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedOrganization: (organization) =>
      set({ selectedOrganization: organization }),
    resetSelectedOrganization: () => set(INITIAL_STATE),
  }),
);
