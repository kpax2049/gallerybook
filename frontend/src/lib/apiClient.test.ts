import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/hooks/use-toast';
import {
  errorHandler,
  serializeParams,
  UNAUTHORIZED_SESSION_EVENT,
} from './apiClient';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
};

beforeEach(() => {
  vi.clearAllMocks();
  storage.clear();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  });
});

describe('serializeParams', () => {
  it('drops empty values and joins arrays', () => {
    const result = serializeParams({
      empty: '',
      nil: null,
      undef: undefined,
      tags: ['a', 'b'],
      statuses: [],
      page: 2,
      favorite: false,
    });

    expect(result).toEqual({
      tags: 'a,b',
      page: 2,
      favorite: false,
    });
  });

  it('stringifies booleans without changing strings/numbers', () => {
    const result = serializeParams({
      hasCover: true,
      owner: 'me',
      count: 5,
    });

    expect(result).toEqual({
      hasCover: true,
      owner: 'me',
      count: 5,
    });
  });
});

describe('errorHandler', () => {
  it('clears auth and notifies the app after a 401 response', () => {
    const listener = vi.fn();
    window.localStorage.setItem('ACCESS_TOKEN', 'stale-token');
    window.addEventListener(UNAUTHORIZED_SESSION_EVENT, listener);

    try {
      errorHandler({ response: { status: 401, data: {} } } as any);
    } finally {
      window.removeEventListener(UNAUTHORIZED_SESSION_EVENT, listener);
    }

    expect(window.localStorage.getItem('ACCESS_TOKEN')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        description: expect.stringContaining('Please login again'),
      })
    );
  });
});
