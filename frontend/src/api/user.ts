import { UserStatus, UserRole } from '../common/enums';
import { apiRequest } from '@/lib/apiClient';
import { Author, Gallery } from './gallery';
import { Profile } from './profile';
import { Person } from './follow';

export interface User {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  role: UserRole;
  email: string;
  hash?: string;
  fullName?: string;
  username: string;
  settings?: { [key: string]: unknown }[];
  status?: UserStatus;
  profile: Profile;
  galleries?: Gallery[];
}

export const getUserInitials = (
  user: User | Author | Person | undefined
): string => {
  const name =
    (user && 'fullName' in user && user.fullName) ||
    (user && 'displayName' in user && user.displayName) ||
    (user && 'username' in user && user.username) ||
    '';

  if (!name.trim()) return 'GB';
  return name
    .trim()
    .split(/\s+/) // split by one or more spaces
    .map((word) => word[0].toUpperCase())
    .join('');
};

// Fetching users
export const getUsers = async (): Promise<User[]> => {
  return await apiRequest<User[]>('/users', 'GET');
};

// Fetching current user
export const getUser = async (options?: {
  suppressUnauthorizedRedirect?: boolean;
}): Promise<User> => {
  return await apiRequest<User>(
    '/users/me',
    'GET',
    undefined,
    undefined,
    undefined,
    {
      suppressUnauthorizedRedirect: options?.suppressUnauthorizedRedirect,
    }
  );
};

export const updateUser = async (
  data: Pick<User, 'fullName' | 'username'>
): Promise<User> => {
  return await apiRequest<User>('/users', 'PATCH', data);
};

export type AccountConflict = {
  field: 'email' | 'username';
  message: string;
};

export function getAccountConflict(
  error: unknown
): AccountConflict | undefined {
  const response = (
    error as {
      response?: { status?: number; data?: unknown };
    }
  )?.response;

  if (response?.status !== 409 || !isRecord(response.data)) return undefined;

  const { field, message } = response.data;
  if (
    (field !== 'email' && field !== 'username') ||
    typeof message !== 'string'
  ) {
    return undefined;
  }

  return { field, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
