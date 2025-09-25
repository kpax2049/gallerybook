import { meFollowingIds } from '@/api/follow';
import { create } from 'zustand';

type FollowState = {
  loaded: boolean;
  ids: Set<number>;
  load: () => Promise<void>;
  isFollowing: (id: number | undefined) => boolean;
  mark: (id: number, value: boolean) => void; // optimistic updates
  reset: () => void;
};

export const useFollowStore = create<FollowState>((set, get) => ({
  loaded: false,
  ids: new Set<number>(),
  load: async () => {
    if (get().loaded) return;

    meFollowingIds()
      .then((data: number[]) => {
        set({ ids: new Set(data), loaded: true });
      })
      .catch(() => {
        set({ ids: new Set(), loaded: true });
      });
  },
  isFollowing: (id) => (id ? get().ids.has(id) : false),
  mark: (id, value) =>
    set((s) => {
      const next = new Set(s.ids);
      if (value) next.add(id);
      else next.delete(id);
      return { ids: next };
    }),
  reset: () => set({ loaded: false, ids: new Set() }),
}));
