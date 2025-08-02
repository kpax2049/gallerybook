import { Gallery } from '@/api/gallery';
import { create } from 'zustand';

type GalleryState = {
  galleries: Gallery[];
  setGalleries: (galleries: Gallery[]) => void;
  getGalleryById: (id: number) => Gallery | undefined;
};

export const useGalleryStore = create<GalleryState>((set, get) => ({
  galleries: [],
  setGalleries: (galleries) => set({ galleries }),
  getGalleryById: (id) => get().galleries.find((g) => g.id === id),
}));
