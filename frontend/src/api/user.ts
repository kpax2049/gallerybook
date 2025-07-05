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
  firstName?: string;
  lastName?: string;
  settings?: { [key: string]: unknown }[];
  status?: UserStatus;
  profile: Profile;
  galleries?: Gallery[];
}

export const getUserInitials = (user: User | undefined): string => {
  return `${user?.firstName?.substring(0, 1)} ${user?.lastName?.substring(0, 1)}`;
};

export const getUserFullName = (user: User | undefined): string => {
  return `${user?.firstName} ${user?.lastName}`;
};

// Fetching users
export const getUsers = async (): Promise<User[]> => {
  return await apiRequest<User[]>('/users', 'GET');
};

// Fetching current user
export const getUser = async (): Promise<User> => {
  return await apiRequest<User>('/users/me', 'GET');
};
