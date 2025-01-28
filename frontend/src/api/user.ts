import { Role, UserStatus } from '@/common/enums';
import { apiRequest } from '@/lib/apiClient';
import { Gallery } from './gallery';

// Define the shape of data for a user
export interface User {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  email: string;
  hash: string;
  firstName?: string;
  lastName?: string;
  settings: { [key: string]: unknown }[];
  status: UserStatus;
  //   profile?: Profile,
  galleries: Gallery[];
}

// Fetching users with our API client
export const getUsers = async (): Promise<User[]> => {
  return await apiRequest<User[]>('/users', 'GET');
};
