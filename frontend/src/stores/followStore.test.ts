import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFollowStore } from './followStore';

const meFollowingIdsMock = vi.fn();

vi.mock('@/api/follow', () => ({
  meFollowingIds: (...args: unknown[]) => meFollowingIdsMock(...args),
}));

describe('useFollowStore', () => {
  beforeEach(() => {
    meFollowingIdsMock.mockReset();
    useFollowStore.getState().reset();
  });

  it('does not restore follow ids when a request resolves after reset', async () => {
    const request = deferred<number[]>();
    meFollowingIdsMock.mockReturnValueOnce(request.promise);

    const loading = useFollowStore.getState().load(1);
    useFollowStore.getState().reset();
    request.resolve([10, 11]);
    await loading;

    expect(useFollowStore.getState()).toMatchObject({
      ownerId: undefined,
      loaded: false,
    });
    expect(useFollowStore.getState().ids).toEqual(new Set());
  });

  it('keeps the newest account data when account loads overlap', async () => {
    const first = deferred<number[]>();
    const second = deferred<number[]>();
    meFollowingIdsMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const firstLoad = useFollowStore.getState().load(1);
    const secondLoad = useFollowStore.getState().load(2);
    second.resolve([20]);
    await secondLoad;
    first.resolve([10]);
    await firstLoad;

    expect(useFollowStore.getState()).toMatchObject({
      ownerId: 2,
      loaded: true,
    });
    expect(useFollowStore.getState().ids).toEqual(new Set([20]));
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
