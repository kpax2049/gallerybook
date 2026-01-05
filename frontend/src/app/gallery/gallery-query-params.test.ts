import { describe, expect, it } from 'vitest';
import {
  defaultFilters,
  defaultSort,
  filtersToQuery,
  queryToFilters,
  queryToSort,
  sortToQuery,
} from './gallery-query-params';
import type { FilterState } from './gallery-query-params';
import type { GalleryStatus } from '@/api/gallery';

describe('gallery query params', () => {
  it('serializes filters while omitting defaults', () => {
    const filters: FilterState = {
      ...defaultFilters,
      status: new Set<GalleryStatus>(['DRAFT', 'PUBLISHED']),
      owner: 'me' as const,
      range: '7d' as const,
      hasCover: true,
      hasTags: false,
      hasComments: null,
      tags: ['tag-a', 'tag-b'],
      search: 'hello',
      favoriteBy: 'me' as const,
      likedBy: 'me' as const,
      followedOnly: true,
      createdById: 12,
    };

    const query = filtersToQuery(filters);

    expect(query.status).toEqual(['DRAFT', 'PUBLISHED']);
    expect(query.owner).toBeUndefined(); // followedOnly omits owner
    expect(query.favoriteBy).toBeUndefined(); // followedOnly omits favoriteBy
    expect(query.likedBy).toBeUndefined(); // followedOnly omits likedBy
    expect(query.range).toBe('7d');
    expect(query.hasCover).toBe('true');
    expect(query.hasTags).toBe('false');
    expect(query.hasComments).toBeUndefined();
    expect(query.tags).toEqual(['tag-a', 'tag-b']);
    expect(query.search).toBe('hello');
    expect(query.followedOnly).toBe('true');
    expect(query.createdById).toBe('12');
  });

  it('parses URLSearchParams into typed filters', () => {
    const sp = new URLSearchParams({
      status: 'DRAFT,PUBLISHED',
      owner: 'me',
      range: '30d',
      hasCover: 'true',
      hasTags: 'false',
      hasComments: 'true',
      tags: 'one,two',
      search: 'abc',
      favoriteBy: 'me',
      likedBy: '123',
      followedOnly: 'true',
      createdById: '7',
    });

    const filters = queryToFilters(sp);

    expect(Array.from(filters.status)).toEqual(['DRAFT', 'PUBLISHED']);
    expect(filters.owner).toBe('me');
    expect(filters.range).toBe('30d');
    expect(filters.hasCover).toBe(true);
    expect(filters.hasTags).toBe(false);
    expect(filters.hasComments).toBe(true);
    expect(filters.tags).toEqual(['one', 'two']);
    expect(filters.search).toBe('abc');
    expect(filters.favoriteBy).toBe('me');
    expect(filters.likedBy).toBe(123);
    expect(filters.followedOnly).toBe(true);
    expect(filters.createdById).toBe(7);
  });

  it('handles numeric favoriteBy and invalid createdById', () => {
    const sp = new URLSearchParams({
      favoriteBy: '123',
      likedBy: 'me',
      createdById: 'not-a-number',
    });

    const filters = queryToFilters(sp);

    expect(filters.favoriteBy).toBe(123);
    expect(filters.likedBy).toBe('me');
    expect(filters.createdById).toBeUndefined();
  });

  it('round-trips filters through URLSearchParams', () => {
    const filters: FilterState = {
      ...defaultFilters,
      owner: 'me' as const,
      hasTags: true,
      status: new Set<GalleryStatus>(['ARCHIVED']),
      tags: ['x'],
      likedBy: 'me',
    };

    const query = filtersToQuery(filters);
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v == null || v === '') continue;
      if (Array.isArray(v)) sp.set(k, v.join(','));
      else sp.set(k, String(v));
    }

    const parsed = queryToFilters(sp);

    expect(parsed.owner).toBe('me');
    expect(parsed.hasTags).toBe(true);
    expect(Array.from(parsed.status)).toEqual(['ARCHIVED']);
    expect(parsed.tags).toEqual(['x']);
    expect(parsed.likedBy).toBe('me');
  });

  it('serializes and parses sort defaults', () => {
    const sortQuery = sortToQuery(defaultSort);
    expect(sortQuery).toEqual({ sortKey: 'updatedAt', sortDir: 'desc' });

    const parsed = queryToSort(new URLSearchParams());
    expect(parsed).toEqual(defaultSort);
  });
});
