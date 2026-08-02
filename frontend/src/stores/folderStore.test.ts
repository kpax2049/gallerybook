import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFolderStore } from './folderStore';

const getFoldersMock = vi.fn();

vi.mock('@/api/folder', () => ({
  createFolder: vi.fn(),
  deleteFolder: vi.fn(),
  getFolders: (...args: unknown[]) => getFoldersMock(...args),
  updateFolder: vi.fn(),
}));

describe('useFolderStore', () => {
  beforeEach(() => {
    getFoldersMock.mockReset();
    useFolderStore.getState().reset();
  });

  it('ignores a folder response that arrives after reset', async () => {
    const request = deferred<Array<{ id: number; name: string }>>();
    getFoldersMock.mockReturnValueOnce(request.promise);

    const loading = useFolderStore.getState().load();
    useFolderStore.getState().reset();
    request.resolve([{ id: 1, name: 'Private folder' }]);
    await loading;

    expect(useFolderStore.getState()).toMatchObject({
      folders: [],
      loaded: false,
      loading: false,
      error: null,
    });
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
