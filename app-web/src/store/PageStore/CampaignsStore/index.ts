import { create } from 'zustand';
import { ICampaignListItem } from '@/shared/interfaces';

interface SelectedCampaignState {
  selectedCampaign: ICampaignListItem | null;
  setSelectedCampaign: (campaign: ICampaignListItem) => void;
  resetSelectedCampaign: () => void;
}

const INITIAL_STATE: Pick<SelectedCampaignState, 'selectedCampaign'> = {
  selectedCampaign: null,
};

export const useSelectedCampaignStore = create<SelectedCampaignState>()(
  (set) => ({
    ...INITIAL_STATE,
    setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
    resetSelectedCampaign: () => set(INITIAL_STATE),
  }),
);
