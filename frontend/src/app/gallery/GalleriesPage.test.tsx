import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import GalleriesPage from './GalleriesPage';
import { useGalleryListState } from '@/stores/galleryStore';

const useGalleriesMock = vi.fn();

const cardCalls: any[] = [];
const rowCalls: any[] = [];

vi.mock('@/hooks/use-gallery', () => ({
  useGalleries: (...args: unknown[]) => useGalleriesMock(...args),
}));

vi.mock('@/components/ui/galleryListToolbar', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/ui/galleryListToolbar')>();
  return {
    ...actual,
    GalleryListToolbar: (props: { view?: string }) => (
      <div data-testid="toolbar" data-view={props.view ?? 'grid'} />
    ),
  };
});

vi.mock('./GalleryCard', () => ({
  GalleryCard: (props: any) => {
    const calledRef = React.useRef(false);
    React.useEffect(() => {
      cardCalls.push(props);
      if (!calledRef.current && props.onReactionChanged) {
        calledRef.current = true;
        props.onReactionChanged({ like: true, favorite: true });
      }
    });

    const likes = props.likesCountOverride ?? props.item.likesCount ?? 0;
    const favs = props.favoritesCountOverride ?? props.item.favoritesCount ?? 0;

    return (
      <div
        data-testid={`card-${props.item.id}`}
        data-likes={likes}
        data-favs={favs}
      />
    );
  },
}));

vi.mock('./GalleryRow', () => ({
  GalleryRow: (props: any) => {
    rowCalls.push(props);
    return <div data-testid={`row-${props.item.id}`} />;
  },
}));

const baseGallery = {
  id: 1,
  slug: 'one',
  title: 'Gallery One',
  likesCount: 5,
  favoritesCount: 0,
  author: { id: 2, username: 'creator' },
  visibility: 'PUBLIC',
};

beforeEach(() => {
  cardCalls.length = 0;
  rowCalls.length = 0;
  useGalleryListState.getState().reset();
  useGalleriesMock.mockReturnValue({
    data: {
      items: [baseGallery],
      total: 1,
      page: 1,
      pageSize: 24,
      commentCounts: { 1: 3 },
      myReactions: { 1: { like: false, favorite: false } },
    },
    loading: false,
    error: null,
  });
});

describe('GalleriesPage', () => {
  it('renders list view when view=list is present', async () => {
    render(
      <MemoryRouter initialEntries={['/galleries?view=list']}>
        <GalleriesPage />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('row-1')).toBeInTheDocument();
    expect(screen.queryByTestId('card-1')).toBeNull();
  });

  it('applies reaction deltas from child callbacks', async () => {
    render(
      <MemoryRouter initialEntries={['/galleries']}>
        <GalleriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const last = cardCalls[cardCalls.length - 1];
      expect(last.likesCountOverride).toBe(6);
      expect(last.favoritesCountOverride).toBe(1);
      expect(last.myReaction).toEqual({ like: true, favorite: true });
    });
  });
});
