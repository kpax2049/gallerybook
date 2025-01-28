import { apiRequest } from '@/lib/apiClient';
import qs from 'qs';

// Define the structure of the data to be sent in a POST request
interface AuthUserRequest {
  email: string;
  password: string;
}

// Define the response structure from the server when a user is created
interface AuthUserResponse {
  access_token: string;
}

// Function to create a new user
export const authUser = async (
  authData: AuthUserRequest
): Promise<AuthUserResponse> => {
  return await apiRequest<AuthUserResponse>(
    '/auth/signin',
    'POST',
    qs.stringify(authData)
  );
};
