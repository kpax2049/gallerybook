import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/lib/apiClient';
import { createComment } from './comment';

vi.mock('@/lib/apiClient', () => ({
  apiRequest: vi.fn(),
}));

describe('createComment', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('sends only server-accepted fields from legacy comment payloads', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: 1 } as never);

    await createComment({
      text: 'Reply',
      galleryId: 7,
      parentId: 3,
      userId: 999,
    } as Parameters<typeof createComment>[0] & { userId: number });

    expect(apiRequest).toHaveBeenCalledWith(
      '/comments',
      'POST',
      'text=Reply&galleryId=7&parentId=3'
    );
  });
});
