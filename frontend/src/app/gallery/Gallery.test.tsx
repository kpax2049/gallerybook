import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import GalleryPage from './Gallery';
import { useUserStore } from '@/stores/userStore';
import { UserRole } from '@/common/enums';

const getGalleryMock = vi.fn();
const getGalleryBySlugMock = vi.fn();
const getPublicGalleryMock = vi.fn();
const toggleReactionMock = vi.fn();

vi.mock('@/api/gallery', () => ({
  getGallery: (...args: unknown[]) => getGalleryMock(...args),
  getGalleryBySlug: (...args: unknown[]) => getGalleryBySlugMock(...args),
  getPublicGallery: (...args: unknown[]) => getPublicGalleryMock(...args),
  toggleReaction: (...args: unknown[]) => toggleReactionMock(...args),
}));

vi.mock('@tiptap/html', () => ({
  generateHTML: () => '',
}));

vi.mock('yet-another-react-lightbox', () => ({
  default: () => null,
}));

vi.mock('yet-another-react-lightbox/plugins/zoom', () => ({
  default: {},
}));

vi.mock('yet-another-react-lightbox/plugins/thumbnails', () => ({
  default: {},
}));

vi.mock('./GalleriesPage', () => ({
  DeskHeader: () => <div data-testid="desk-header" />,
}));

vi.mock('./galleryComment/Comment', () => ({
  default: () => <div data-testid="comments" />,
}));

const gallery = {
  id: 42,
  userId: 7,
  title: 'Loaded Gallery',
  description: '',
  status: 'PUBLISHED',
  visibility: 'PUBLIC',
  author: { id: 7, username: 'creator' },
  content: { type: 'doc', content: [] },
  likesCount: 3,
  favoritesCount: 4,
  viewsCount: 5,
  tags: [],
};

beforeEach(() => {
  cleanup();
  getGalleryMock.mockReset();
  getGalleryBySlugMock.mockReset();
  getPublicGalleryMock.mockReset();
  toggleReactionMock.mockReset();
  useUserStore.getState().setUser({
    id: 1,
    role: UserRole.USER,
    email: 'viewer@example.com',
    username: 'viewer',
    profile: { id: 1, userId: 1 },
  });
});

describe('GalleryPage', () => {
  it('initializes reaction buttons from gallery detail response', async () => {
    getGalleryMock.mockResolvedValueOnce({
      ...gallery,
      myReaction: { like: true, favorite: true },
    });

    render(
      <MemoryRouter initialEntries={['/galleries/42']}>
        <Routes>
          <Route path="/galleries/:galleryId" element={<GalleryPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('button', { name: 'Unlike' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Remove favorite' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses the anonymous endpoint and hides interactive controls in public mode', async () => {
    getPublicGalleryMock.mockResolvedValueOnce(gallery);

    render(
      <MemoryRouter initialEntries={['/shared/galleries/loaded-gallery']}>
        <Routes>
          <Route
            path="/shared/galleries/:galleryId"
            element={<GalleryPage publicView />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'Loaded Gallery' })
    ).toBeInTheDocument();
    expect(getPublicGalleryMock).toHaveBeenCalledWith('loaded-gallery');
    expect(getGalleryMock).not.toHaveBeenCalled();
    expect(getGalleryBySlugMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('comments')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Like' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Favorite' })
    ).not.toBeInTheDocument();
  });
});
