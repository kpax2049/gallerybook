import { signout } from '@/api/auth';
import { User } from '@/api/user';
import { useFolderStore } from '@/stores/folderStore';
import { useGalleryListState, useGalleryStore } from '@/stores/galleryStore';
import { useFollowStore } from '@/stores/followStore';
import { useThumbStore } from '@/stores/thumbStore';
import { useUserStore } from '@/stores/userStore';

const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
let sessionRevision = 0;

export function setAccessToken(token: string) {
  sessionRevision += 1;
  try {
    safeLocalStorage()?.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // Store synchronization still proceeds when browser storage is blocked.
  }
}

export async function startAuthSession(user: User) {
  sessionRevision += 1;
  useUserStore.getState().clearUser();
  resetAccountStores();
  useUserStore.getState().setUser(user);
  await useFollowStore.getState().load(user.id);
}

export function clearAuthSession() {
  sessionRevision += 1;
  useUserStore.getState().clearUser();
  resetAccountStores();
  try {
    safeLocalStorage()?.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Store synchronization still proceeds when browser storage is blocked.
  }
}

export function getAuthSessionRevision() {
  return sessionRevision;
}

export function isAuthSessionRevisionCurrent(revision: number) {
  return revision === sessionRevision;
}

export async function endAuthSession() {
  try {
    await signout();
  } finally {
    clearAuthSession();
  }
}

function resetAccountStores() {
  useFollowStore.getState().reset();
  useFolderStore.getState().reset();
  useGalleryStore.getState().reset();
  useGalleryListState.getState().reset();
  useThumbStore.getState().reset();
}

function safeLocalStorage() {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
