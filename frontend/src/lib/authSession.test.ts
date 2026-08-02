import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@/common/enums';
import { useFolderStore } from '@/stores/folderStore';
import { useGalleryListState, useGalleryStore } from '@/stores/galleryStore';
import { useFollowStore } from '@/stores/followStore';
import { useThumbStore } from '@/stores/thumbStore';
import { useUserStore } from '@/stores/userStore';
import {
  clearAuthSession,
  endAuthSession,
  setAccessToken,
  startAuthSession,
} from './authSession';

const signoutMock = vi.fn();
const meFollowingIdsMock = vi.fn();
const storage = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
  configurable: true,
});

vi.mock('@/api/auth', () => ({
  signout: (...args: unknown[]) => signoutMock(...args),
}));

vi.mock('@/api/follow', () => ({
  meFollowingIds: (...args: unknown[]) => meFollowingIdsMock(...args),
}));

const user = {
  id: 2,
  role: UserRole.USER,
  email: 'new@example.com',
  username: 'new-user',
  profile: { id: 2, userId: 2 },
};

describe('authSession', () => {
  beforeEach(() => {
    signoutMock.mockReset();
    meFollowingIdsMock.mockReset();
    storage.clear();
    clearAuthSession();
  });

  it('starts a clean account session and loads its follow state', async () => {
    useFolderStore.setState({
      folders: [{ id: 1, name: 'Old folder' } as never],
      loaded: true,
    });
    useGalleryStore.getState().setGalleries([{ id: 1 } as never]);
    useThumbStore.getState().setIndex(3);
    meFollowingIdsMock.mockResolvedValue([7, 8]);

    await startAuthSession(user);

    expect(useUserStore.getState().user).toEqual(user);
    expect(useFollowStore.getState()).toMatchObject({
      ownerId: 2,
      loaded: true,
    });
    expect(useFollowStore.getState().ids).toEqual(new Set([7, 8]));
    expect(useFolderStore.getState().folders).toEqual([]);
    expect(useGalleryStore.getState().galleries).toEqual([]);
    expect(useThumbStore.getState().index).toBe(0);
  });

  it('clears every account-scoped store and the access token', () => {
    useUserStore.getState().setUser(user);
    useFollowStore.setState({
      ownerId: user.id,
      loaded: true,
      ids: new Set([9]),
    });
    useFolderStore.setState({
      folders: [{ id: 1, name: 'Private folder' } as never],
      loaded: true,
    });
    useGalleryStore.getState().setGalleries([{ id: 1 } as never]);
    useGalleryListState.getState().setPager({ page: 4, pageSize: 24 });
    useThumbStore.getState().setIndex(2);
    setAccessToken('token');

    clearAuthSession();

    expect(useUserStore.getState().user).toBeUndefined();
    expect(useFollowStore.getState().ids).toEqual(new Set());
    expect(useFolderStore.getState().folders).toEqual([]);
    expect(useGalleryStore.getState().galleries).toEqual([]);
    expect(useGalleryListState.getState().pager.page).toBe(1);
    expect(useThumbStore.getState().index).toBe(0);
    expect(window.localStorage.getItem('ACCESS_TOKEN')).toBeNull();
  });

  it('clears local state even when server sign-out fails', async () => {
    signoutMock.mockRejectedValue(new Error('offline'));
    useUserStore.getState().setUser(user);
    setAccessToken('token');

    await expect(endAuthSession()).rejects.toThrow('offline');

    expect(useUserStore.getState().user).toBeUndefined();
    expect(window.localStorage.getItem('ACCESS_TOKEN')).toBeNull();
  });
});
