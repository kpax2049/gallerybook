import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useGalleries } from './use-gallery';
import type { GalleriesListResponse } from '@/api/gallery';
import type { FilterState } from '@/app/gallery/gallery-query-params';

const getGalleriesListMock =
  vi.fn<typeof import('@/api/gallery')['getGalleriesList']>();

vi.mock('@/api/gallery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/gallery')>();
  return {
    ...actual,
    getGalleriesList: (
      ...args: Parameters<typeof getGalleriesListMock>
    ) => getGalleriesListMock(...args),
  };
});

const baseResponse: GalleriesListResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 24,
  commentCounts: {},
  myReactions: {},
};

const defaultSort = { key: 'updatedAt', dir: 'desc' } as const;
const defaultFilters: FilterState = {
  status: new Set(),
  owner: 'any',
  range: 'any',
  hasCover: null,
  hasTags: null,
  hasComments: null,
  tags: [],
  search: '',
};

const deferred = <T>() => {
  let resolve!: (v: T) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  getGalleriesListMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useGalleries', () => {
  it('loads data on mount and clears loading afterward', async () => {
    getGalleriesListMock.mockResolvedValueOnce({
      ...baseResponse,
      items: [{ id: 1 } as any],
    });

    const { result } = renderHook(
      (props: Partial<Parameters<typeof useGalleries>[0]> = {}) =>
        useGalleries({
          sort: defaultSort,
          filters: defaultFilters,
          page: 1,
          pageSize: 24,
          ...props,
        })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.items[0].id).toBe(1);
    });
  });

  it('ignores stale responses when params change', async () => {
    const slow = deferred<GalleriesListResponse>();
    const fast = deferred<GalleriesListResponse>();

    getGalleriesListMock
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);

    const { result, rerender } = renderHook(
      ({ search }) =>
        useGalleries({
          sort: defaultSort,
          filters: { ...defaultFilters, search },
          page: 1,
          pageSize: 24,
        }),
      { initialProps: { search: 'one' } }
    );

    expect(result.current.loading).toBe(true);

    rerender({ search: 'two' });
    await act(async () => {
      fast.resolve({ ...baseResponse, items: [{ id: 2 } as any] });
    });

    await waitFor(() => {
      expect(result.current.data?.items[0].id).toBe(2);
      expect(result.current.fetching).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    // now resolve the slow response; it should be ignored
    await act(async () => {
      slow.resolve({ ...baseResponse, items: [{ id: 99 } as any] });
    });

    expect(result.current.data?.items[0].id).toBe(2);
  });
});
