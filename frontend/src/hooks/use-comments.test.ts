import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useComments } from './use-comments';
import type { CommentsListResponse } from '@/api/comment';

const getCommentsListMock =
  vi.fn<typeof import('@/api/comment')['getCommentsList']>();

vi.mock('@/api/comment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/comment')>();
  return {
    ...actual,
    getCommentsList: (
      ...args: Parameters<typeof getCommentsListMock>
    ) => getCommentsListMock(...args),
  };
});

const baseResponse: CommentsListResponse = {
  items: [
    {
      id: 1,
      body: 'hi',
      createdAt: new Date().toISOString(),
      author: { id: 1, name: 'a' },
      gallery: { id: 1, title: 'g' },
    },
  ],
  total: 1,
  page: 1,
  pageSize: 24,
};

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  getCommentsListMock.mockReset();
});

describe('useComments', () => {
  it('debounces search before fetching and sets loading states', async () => {
    const resp = { ...baseResponse, items: [{ ...baseResponse.items[0], id: 2 }] };
    getCommentsListMock.mockResolvedValueOnce(resp);

    const { result } = renderHook(() =>
      useComments({
        scope: 'authored',
        page: 1,
        pageSize: 10,
        search: 'hello',
      })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(getCommentsListMock).toHaveBeenCalledWith({
        scope: 'authored',
        page: 1,
        pageSize: 10,
        search: 'hello',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.items[0].id).toBe(2);
    });
  });

  it('ignores stale responses when params change mid-flight', async () => {
    const slow = deferred<CommentsListResponse>();
    const fast = deferred<CommentsListResponse>();

    getCommentsListMock
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);

    const { result, rerender } = renderHook(
      ({ search }) =>
        useComments({
          scope: 'authored',
          page: 1,
          pageSize: 10,
          search,
        }),
      { initialProps: { search: 'one' } }
    );

    rerender({ search: 'two' });
    await waitFor(() => {
      expect(getCommentsListMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      fast.resolve({
        ...baseResponse,
        items: [{ ...baseResponse.items[0], id: 3 }],
      });
    });

    await waitFor(() => {
      expect(result.current.data?.items[0].id).toBe(3);
      expect(result.current.fetching).toBe(false);
    });

    await act(async () => {
      slow.resolve({
        ...baseResponse,
        items: [{ ...baseResponse.items[0], id: 99 }],
      });
    });

    expect(result.current.data?.items[0].id).toBe(3);
  });
});
