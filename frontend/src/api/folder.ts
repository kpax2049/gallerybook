import { apiRequest } from '@/lib/apiClient';

export interface Folder {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  userId: number;
  galleriesCount: number;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
}

export type UpdateFolderRequest = Partial<CreateFolderRequest>;

export const getFolders = async (): Promise<Folder[]> => {
  return await apiRequest<Folder[]>('/folders', 'GET');
};

export const createFolder = async (
  data: CreateFolderRequest
): Promise<Folder> => {
  return await apiRequest<Folder>('/folders', 'POST', data);
};

export const updateFolder = async (
  folderId: number,
  data: UpdateFolderRequest
): Promise<Folder> => {
  return await apiRequest<Folder>(`/folders/${folderId}`, 'PATCH', data);
};

export const deleteFolder = async (folderId: number): Promise<void> => {
  await apiRequest<void>(`/folders/${folderId}`, 'DELETE');
};
