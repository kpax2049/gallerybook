import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { NavMain } from './nav-main';
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
} from '@/components/ui/sidebar';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

const navItems = [
  {
    title: 'Library',
    url: '#',
    items: [
      { title: 'Galleries', url: '/galleries?owner=me' },
      { title: 'Favorites', url: '/galleries?favoriteBy=me' },
      { title: 'Drafts', url: '/galleries?owner=me&status=draft' },
      { title: 'Comments', url: '/me/comments' },
    ],
  },
];

function renderNav(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain items={navItems} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
});

function isActive(title: string) {
  return screen
    .getAllByText(title)
    .some(
      (el) =>
        el
          .closest('[data-sidebar="menu-sub-button"]')
          ?.getAttribute('data-active') === 'true'
    );
}

describe('NavMain active states', () => {
  it('marks Favorites active when favoriteBy=me', () => {
    renderNav('/galleries?favoriteBy=me');
    expect(isActive('Favorites')).toBe(true);
    expect(isActive('Galleries')).toBe(false);
  });

  it('marks Drafts active when owner=me and status=draft', () => {
    renderNav('/galleries?owner=me&status=draft');
    expect(isActive('Drafts')).toBe(true);
    expect(isActive('Favorites')).toBe(false);
  });

  it('marks Comments active for /me/comments path', () => {
    renderNav('/me/comments');
    expect(isActive('Comments')).toBe(true);
  });
});
