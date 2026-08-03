import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@/common/enums';
import { useUserStore } from '@/stores/userStore';
import { UserProfileEditor } from './UserProfileEditor';

const updateUserMock = vi.fn();

vi.mock('@/api/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/user')>();
  return {
    ...actual,
    updateUser: (...args: unknown[]) => updateUserMock(...args),
  };
});

vi.mock('./AvatarUpload', () => ({
  AvatarUpload: () => <div>Avatar upload</div>,
}));

describe('UserProfileEditor', () => {
  beforeEach(() => {
    updateUserMock.mockReset();
    useUserStore.setState({
      user: {
        id: 1,
        role: UserRole.USER,
        email: 'user@example.com',
        fullName: 'Example User',
        username: 'example-user',
        profile: { id: 1, userId: 1 },
      },
    });
  });

  it('shows duplicate username conflicts beside the username field', async () => {
    updateUserMock.mockRejectedValue({
      response: {
        status: 409,
        data: {
          field: 'username',
          message: 'Username is already in use.',
        },
      },
    });
    render(<UserProfileEditor />);

    await waitFor(() =>
      expect(screen.getByLabelText('Username')).toHaveValue('example-user')
    );
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: '  taken-user  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Username is already in use.')
    ).toBeVisible();
    expect(updateUserMock).toHaveBeenCalledWith({
      fullName: 'Example User',
      username: 'taken-user',
    });
  });
});
