import { apiRequest } from '@/lib/apiClient';

export interface Profile {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  avatarUrl?: string;
  userId: number;
  configuration?: { [key: string]: unknown }[];
}

export interface AvatarUploadResponse {
  url: string;
  public_id: string;
}

// Upload User avatar
export const uploadAvatar = async (
  data: FormData
): Promise<AvatarUploadResponse> => {
  return await apiRequest<AvatarUploadResponse>(
    '/profile/upload-avatar',
    'POST',
    data
  );
};
