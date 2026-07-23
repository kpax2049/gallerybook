import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PendingActivation } from './PendingActivation';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

afterEach(() => {
  cleanup();
  storage.clear();
});

describe('PendingActivation', () => {
  it('explains the approval state and clears unusable access tokens', async () => {
    window.localStorage.setItem('ACCESS_TOKEN', 'inactive-token');

    render(
      <MemoryRouter>
        <PendingActivation />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: 'Approval pending' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/waiting for an administrator/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /return to sign in/i })
    ).toHaveAttribute('href', '/login');
    expect(screen.queryByText('Create account')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(window.localStorage.getItem('ACCESS_TOKEN')).toBeNull()
    );
  });
});
