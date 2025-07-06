import { apiRequest } from '@/lib/apiClient';
import qs from 'qs';

// Define the structure of the data to be sent in a POST request
interface SignupRequest {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
}

// Define the response structure from the server when a user is created
interface SignupResponse {
  access_token: string;
}

// Function to create a new user
export const signupUser = async (
  signupData: SignupRequest
): Promise<SignupResponse> => {
  return await apiRequest<SignupResponse>(
    '/auth/signup',
    'POST',
    qs.stringify(signupData)
  );
};
