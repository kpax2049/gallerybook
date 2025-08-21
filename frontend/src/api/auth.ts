import { apiRequest } from '@/lib/apiClient';
import qs from 'qs';

// Define the structure of the data to be sent in a POST request
interface AuthUserRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: true;
  accessToken: string;
}
export interface VerifyPasswordRequest {
  currentPassword: string;
}
export interface VerifyPasswordResponse {
  valid: boolean;
}

// Define the response structure from the server when a user is created
interface AuthUserResponse {
  accessToken: string;
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

export const changePassword = async (
  requestData: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  return await apiRequest<ChangePasswordResponse>(
    '/auth/password',
    'PATCH',
    qs.stringify(requestData)
  );
};

export const verifyCurrentPassword = async (
  requestData: VerifyPasswordRequest
): Promise<VerifyPasswordResponse> => {
  return await apiRequest<VerifyPasswordResponse>(
    '/auth/password/verify',
    'POST',
    qs.stringify(requestData)
  );
};
