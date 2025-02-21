import { apiRequest } from '@/lib/apiClient';
import { User } from './user';
import qs from 'qs';
// import { TipTapNode } from '@troop.com/tiptap-react-render';
// import { Content } from '@tiptap/react';

export interface Gallery {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  createdBy: User;
  title?: string;
  description?: string;
  content?: string;
  thumbnail?: string;
  //   images: Image[];
}

interface CreateGalleryRequest {
  title?: string;
  description?: string;
  content?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thumbnail?: any;
}
// Function to create new gallery
export const createGallery = async (
  galleryData: CreateGalleryRequest
): Promise<Gallery> => {
  return await apiRequest<Gallery>(
    '/galleries',
    'POST',
    qs.stringify(galleryData)
  );
};

// Fetching galleries
export const getGalleries = async (): Promise<Gallery[]> => {
  return await apiRequest<Gallery[]>('/galleries', 'GET');
};

// Fetch single gallery
export const getGallery = async (
  galleryId: string | undefined
): Promise<Gallery> => {
  return await apiRequest<Gallery>(`/galleries/${galleryId}`, 'GET');
};
