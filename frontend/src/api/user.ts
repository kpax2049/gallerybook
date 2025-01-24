import { apiRequest } from '@/lib/apiClient';

// Define the shape of data for a user
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Define the shape of the response for fetching multiple users
interface UserListResponse {
  users: User[];
  total: number;
}

// Fetching users with our API client
export const fetchUsers = async (): Promise<UserListResponse> => {
  return await apiRequest<UserListResponse>('/users', 'GET');
};
