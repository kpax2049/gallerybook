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

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  loaded: false,
  loading: false,
  error: null,
  load: async (options) => {
    if (get().loading || (get().loaded && !options?.force)) return;

    set({ loading: true, error: null });
    try {
      const folders = await getFolders();
      set({ folders, loaded: true, loading: false, error: null });
    } catch (error) {
      set({
        folders: [],
        loaded: true,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  },
  createFolder: async (data) => {
    const folder = await createFolder(data);
    set((state) => ({ folders: [folder, ...state.folders], loaded: true }));
    return folder;
  },
  updateFolder: async (folderId, data) => {
    const folder = await updateFolder(folderId, data);
    set((state) => ({
      folders: state.folders.map((item) =>
        item.id === folderId ? folder : item
      ),
    }));
    return folder;
  },
  deleteFolder: async (folderId) => {
    await deleteFolder(folderId);
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== folderId),
    }));
  },
  setFolders: (folders) => set({ folders, loaded: true, error: null }),
  reset: () => set({ folders: [], loaded: false, loading: false, error: null }),
}));
