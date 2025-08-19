import { create } from 'zustand';

type ThumbState = {
  index: number;
  setIndex: (i: number) => void;
  reset: () => void;
};

export const useThumbStore = create<ThumbState>((set) => ({
  index: 0,
  setIndex: (i) => set((s) => (s.index === i ? s : { index: i })),
  reset: () => set({ index: 0 }),
}));
