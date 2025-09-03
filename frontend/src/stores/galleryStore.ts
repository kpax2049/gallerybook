import { Gallery } from '@/api/gallery';
import {
  SortState,
  FilterState,
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
  setFilters: (f: FilterState) => void;
  setPager: (p: Pager) => void;
  reset: () => void;
};

export const useGalleryListState = create<Store>((set) => ({
  sort: defaultSort,
  filters: { ...defaultFilters },
  pager: { page: 1, pageSize: 24 },
  setSort: (sort) => set({ sort }),
  setFilters: (filters) => set({ filters, pager: { page: 1, pageSize: 24 } }), // reset to page 1
  setPager: (pager) => set({ pager }),
  reset: () =>
    set({
      sort: defaultSort,
      filters: { ...defaultFilters },
      pager: { page: 1, pageSize: 24 },
    }),
}));
