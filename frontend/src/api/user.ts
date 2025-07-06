import { UserStatus, UserRole } from '../common/enums';
import { apiRequest } from '@/lib/apiClient';
import { Gallery } from './gallery';
import { Profile } from './profile';

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

export const getUserInitials = (user: User | undefined): string => {
  if (!user?.fullName) return 'GB';

  return user?.fullName
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
export const getUser = async (): Promise<User> => {
  return await apiRequest<User>('/users/me', 'GET');
};
