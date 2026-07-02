import { useEffect } from 'react';
import { useFolderStore } from '@/stores/folderStore';

export function useFolders() {
  const folders = useFolderStore((state) => state.folders);
  const loaded = useFolderStore((state) => state.loaded);
  const loading = useFolderStore((state) => state.loading);
  const error = useFolderStore((state) => state.error);
  const load = useFolderStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    folders,
    loaded,
    loading,
    error,
    reload: () => load({ force: true }),
  };
}
