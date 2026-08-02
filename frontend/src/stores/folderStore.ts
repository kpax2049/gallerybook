import {
  createFolder,
  deleteFolder,
  Folder,
  getFolders,
  updateFolder,
  type CreateFolderRequest,
  type UpdateFolderRequest,
} from '@/api/folder';
import { create } from 'zustand';

type FolderState = {
  folders: Folder[];
  loaded: boolean;
  loading: boolean;
  error: Error | null;
  load: (options?: { force?: boolean }) => Promise<void>;
  createFolder: (data: CreateFolderRequest) => Promise<Folder>;
  updateFolder: (
    folderId: number,
    data: UpdateFolderRequest
  ) => Promise<Folder>;
  deleteFolder: (folderId: number) => Promise<void>;
  setFolders: (folders: Folder[]) => void;
  reset: () => void;
};

let storeGeneration = 0;

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  loaded: false,
  loading: false,
  error: null,
  load: async (options) => {
    if (get().loading || (get().loaded && !options?.force)) return;

    const generation = storeGeneration;
    set({ loading: true, error: null });
    try {
      const folders = await getFolders();
      if (generation !== storeGeneration) return;
      set({ folders, loaded: true, loading: false, error: null });
    } catch (error) {
      if (generation !== storeGeneration) return;
      set({
        folders: [],
        loaded: true,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  },
  createFolder: async (data) => {
    const generation = storeGeneration;
    const folder = await createFolder(data);
    if (generation === storeGeneration) {
      set((state) => ({ folders: [folder, ...state.folders], loaded: true }));
    }
    return folder;
  },
  updateFolder: async (folderId, data) => {
    const generation = storeGeneration;
    const folder = await updateFolder(folderId, data);
    if (generation === storeGeneration) {
      set((state) => ({
        folders: state.folders.map((item) =>
          item.id === folderId ? folder : item
        ),
      }));
    }
    return folder;
  },
  deleteFolder: async (folderId) => {
    const generation = storeGeneration;
    await deleteFolder(folderId);
    if (generation === storeGeneration) {
      set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== folderId),
      }));
    }
  },
  setFolders: (folders) => set({ folders, loaded: true, error: null }),
  reset: () => {
    storeGeneration += 1;
    set({ folders: [], loaded: false, loading: false, error: null });
  },
}));
