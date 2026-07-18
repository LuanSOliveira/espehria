import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FontAccessibilityState {
  fontSizeLevel: number;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
}

export const useFontAccessibilityStore = create<FontAccessibilityState>()(
  persist(
    (set) => ({
      fontSizeLevel: 0,
      increaseFont: () =>
        set((state) => ({ fontSizeLevel: state.fontSizeLevel + 1 })),
      decreaseFont: () =>
        set((state) => ({ fontSizeLevel: state.fontSizeLevel - 1 })),
      resetFont: () => set({ fontSizeLevel: 0 }),
    }),
    {
      name: 'font-accessibility-storage',
    },
  ),
);
