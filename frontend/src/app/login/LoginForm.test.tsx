import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginForm } from './LoginForm';

const authUserMock = vi.fn();
const getUserMock = vi.fn();
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

vi.mock('@/api/auth', () => ({
  authUser: (...args: unknown[]) => authUserMock(...args),
  getOAuthLoginUrl: (provider: string) => `/auth/oauth/${provider}`,
  signout: vi.fn(),
}));

vi.mock('@/api/user', () => ({
  getUser: (...args: unknown[]) => getUserMock(...args),
}));

vi.mock('./Login', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    authUserMock.mockReset();
    getUserMock.mockReset();
    storage.clear();
  });

  it('routes pending accounts to the approval screen without loading a user', async () => {
    authUserMock.mockResolvedValue({ status: 'pending' });
    window.localStorage.setItem('ACCESS_TOKEN', 'stale-token');
    const handleLogin = vi.fn();

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={<LoginForm handleLogin={handleLogin} />}
          />
          <Route path="/account/pending" element={<p>Pending destination</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'pending@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open my album' }));

    await screen.findByText('Pending destination');
    await waitFor(() => {
      expect(authUserMock).toHaveBeenCalledWith({
        email: 'pending@example.com',
        password: 'password',
      });
    });
    expect(getUserMock).not.toHaveBeenCalled();
    expect(handleLogin).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('ACCESS_TOKEN')).toBeNull();
  });
});
