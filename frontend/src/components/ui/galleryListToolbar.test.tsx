import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { GalleryListToolbar } from './galleryListToolbar';
import type { FilterState, SortState } from '@/app/gallery/gallery-query-params';
import type { GalleryStatus } from '@/api/gallery';

const baseFilters: FilterState = {
  status: new Set(),
  owner: 'any',
  range: 'any',
  hasCover: null,
  hasTags: null,
  hasComments: null,
  tags: [],
  search: '',
};

const baseSort: SortState = { key: 'updatedAt', dir: 'desc' };

function renderToolbar(
  overrides: Partial<{
    filters: FilterState;
    sort: SortState;
    onFiltersChange: (f: FilterState) => void;
    onSortChange: (s: SortState) => void;
  }> = {}
) {
  const onFiltersChange = overrides.onFiltersChange ?? vi.fn();
  const onSortChange = overrides.onSortChange ?? vi.fn();
  render(
    <GalleryListToolbar
      filters={overrides.filters ?? baseFilters}
      sort={overrides.sort ?? baseSort}
      onFiltersChange={onFiltersChange}
      onSortChange={onSortChange}
    />
  );
  return { onFiltersChange, onSortChange };
}

describe('GalleryListToolbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search input before emitting onFiltersChange', async () => {
    const { onFiltersChange } = renderToolbar();
    const input = screen.getByPlaceholderText('Search…');

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onFiltersChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(310);
    await Promise.resolve();

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'abc' })
    );
  });

  it('shows active filter count badge when filters are applied', () => {
    const filters: FilterState = {
      ...baseFilters,
      status: new Set<GalleryStatus>(['DRAFT', 'PUBLISHED']),
      hasCover: true,
      hasTags: false,
      tags: ['x'],
      owner: 'me',
    };

    renderToolbar({ filters });

    const counted = screen.getAllByRole('button', { name: /Filters/ }).find((btn) =>
      btn.textContent?.includes('(5)')
    );

    expect(counted?.textContent).toContain('(5)');
  });
});
