import { Gallery } from '@/api/gallery';
import { FilterState, SortState } from '@/app/gallery/gallery-query-params';
import {
  defaultSort,
  defaultFilters,
} from '@/components/ui/galleryListToolbar';

import { create } from 'zustand';

type GalleryState = {
  galleries: Gallery[];
  setGalleries: (galleries: Gallery[]) => void;
  getGalleryById: (id: number) => Gallery | undefined;
};
type Pager = { page: number; pageSize: number };

export const useGalleryStore = create<GalleryState>((set, get) => ({
  galleries: [],
  setGalleries: (galleries) => set({ galleries }),
  getGalleryById: (id) => get().galleries.find((g) => g.id === id),
}));

type Store = {
  sort: SortState;
  filters: FilterState;
  pager: Pager;
  setSort: (s: SortState) => void;
  setFilters: (f: FilterState | ((prev: FilterState) => FilterState)) => void;
  setPager: (p: Pager) => void;
  reset: () => void;
};

export const useGalleryListState = create<Store>((set) => ({
  sort: defaultSort,
  filters: { ...defaultFilters },
  pager: { page: 1, pageSize: 24 },
  setSort: (sort) => set({ sort }),
  setFilters: (f) =>
    set((state) => ({
      filters:
        typeof f === 'function'
          ? (f as (p: FilterState) => FilterState)(state.filters)
          : f,
    })),
  setPager: (pager) => set({ pager }),
  reset: () =>
    set({
      sort: defaultSort,
      filters: { ...defaultFilters },
      pager: { page: 1, pageSize: 24 },
    }),
}));
