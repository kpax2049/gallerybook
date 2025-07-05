import { apiRequest } from '@/lib/apiClient';

export interface Profile {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  avatarUrl?: string;
  userId: number;
  configuration?: { [key: string]: unknown }[];
}

// Upload User avatar
export const uploadAvatar = async (data: FormData): Promise<Profile> => {
  return await apiRequest<Profile>('/profile/upload-avatar', 'POST', data);
};
