import { meFollowingIds } from '@/api/follow';
import { create } from 'zustand';

type FollowState = {
  ownerId?: number;
  loaded: boolean;
  ids: Set<number>;
  load: (ownerId: number) => Promise<void>;
  isFollowing: (id: number | undefined) => boolean;
  mark: (id: number, value: boolean) => void; // optimistic updates
  reset: () => void;
};

let loadGeneration = 0;

export const useFollowStore = create<FollowState>((set, get) => ({
  ownerId: undefined,
  loaded: false,
  ids: new Set<number>(),
  load: async (ownerId) => {
    if (get().loaded && get().ownerId === ownerId) return;

    const generation = ++loadGeneration;
    set({ ownerId, ids: new Set(), loaded: false });
    try {
      const data = await meFollowingIds();
      if (generation !== loadGeneration || get().ownerId !== ownerId) return;
      set({ ids: new Set(data), loaded: true });
    } catch {
      if (generation !== loadGeneration || get().ownerId !== ownerId) return;
      set({ ids: new Set(), loaded: true });
    }
  },
  isFollowing: (id) => (id ? get().ids.has(id) : false),
  mark: (id, value) =>
    set((s) => {
      if (s.ownerId === undefined) return s;
      const next = new Set(s.ids);
      if (value) next.add(id);
      else next.delete(id);
      return { ids: next };
    }),
  reset: () => {
    loadGeneration += 1;
    set({ ownerId: undefined, loaded: false, ids: new Set() });
  },
}));
