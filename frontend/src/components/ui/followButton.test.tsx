import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';

import { FollowButton } from './followButton';
import { useFollowStore } from '@/stores/followStore';

const followMock = vi.fn();

vi.mock('@/api/follow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/follow')>();
  return { ...actual, follow: (...args: any[]) => followMock(...args) };
});

describe('FollowButton', () => {
  beforeEach(() => {
    followMock.mockReset();
    useFollowStore.setState({ loaded: true, ids: new Set(), load: async () => {}, isFollowing: () => false, mark: useFollowStore.getState().mark, reset: () => {} });
  });

  it('optimistically follows and calls API', async () => {
    followMock.mockResolvedValue({ ok: true });

    render(<FollowButton userId={1} iconOnly />);

    fireEvent.click(screen.getByRole('button', { name: /follow/i }));

    expect(useFollowStore.getState().ids.has(1)).toBe(true);
    expect(followMock).toHaveBeenCalledWith(1, 'POST');
  });

  it('reverts optimistic change when API fails', async () => {
    followMock.mockRejectedValueOnce(new Error('fail'));

    render(<FollowButton userId={2} iconOnly />);

    const btn = screen.getAllByRole('button', { name: /follow/i })[0];
    fireEvent.click(btn);
    await act(async () => Promise.resolve());

    expect(useFollowStore.getState().ids.has(2)).toBe(false);
  });
});
