import { apiRequest } from '@/lib/apiClient';

export type OkResponse = { ok: true };
export type Person = {
  id: number;
  fullName?: string | null;
  email: string;
  avatarUrl?: string | null;
};

export const follow = async (
  userId: number | undefined,
  method: 'POST' | 'DELETE'
): Promise<OkResponse> => {
  return await apiRequest(`/users/${userId}/follow`, method);
};

export const meFollowing = async (): Promise<Person[]> => {
  return await apiRequest('/me/following', 'GET');
};
