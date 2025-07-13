import { apiRequest } from '@/lib/apiClient';
import { User } from './user';
import qs from 'qs';
import axios from 'axios';

export interface Gallery {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  userId: number;
  createdBy?: User;
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

// Function to edit new gallery
export const editGallery = async (galleryData: Gallery): Promise<Gallery> => {
  return await apiRequest<Gallery>(
    `/galleries/${galleryData.id}`,
    'PATCH',
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

export const uploadImagesToS3 = async (
  images: { path: string; file: File }[]
): Promise<Record<string, string>> => {
  let presignData: Record<string, string>;
  try {
    //   JSON.stringify({ paths: images.map((i) => i.path) })
    const response = await apiRequest<Record<string, string>>(
      '/galleries/presign',
      'POST',
      {
        paths: images.map((img) => img.path),
      }
    );
    presignData = response;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    throw new Error('Failed to fetch S3 presigned URLs');
  }

  const uploadedPaths: string[] = [];

  for (const { path, file } of images) {
    const url = presignData[path];
    if (!url) {
      console.warn(`No presigned URL returned for ${path}`);
      continue;
    }

    try {
      await axios.put(url, file, {
        headers: { 'Content-Type': file.type },
      });
      uploadedPaths.push(path);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new Error(`Upload failed for ${path}`);
    }
  }

  // Return map of original paths -> actual S3 URLs (strip query string)
  return Object.fromEntries(
    uploadedPaths.map((path) => [path, presignData[path].split('?')[0]])
  );
};
