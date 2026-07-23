import { create } from 'zustand';
import { IEventListItem } from '@/shared/interfaces';

interface SelectedEventState {
  selectedEvent: IEventListItem | null;
  setSelectedEvent: (event: IEventListItem) => void;
  resetSelectedEvent: () => void;
}

const INITIAL_STATE: Pick<SelectedEventState, 'selectedEvent'> = {
  selectedEvent: null,
};

export const useSelectedEventStore = create<SelectedEventState>()((set) => ({
  ...INITIAL_STATE,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  resetSelectedEvent: () => set(INITIAL_STATE),
}));
