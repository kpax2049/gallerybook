/* eslint-disable @typescript-eslint/no-unused-vars */
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
  content?: Record<string, string>;
  thumbnail?: string;
}

interface CreateDraftGalleryRequest {
  title?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thumbnail?: any;
}

interface CreateGalleryRequest {
  content?: string;
}

export interface EditGalleryRequest {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: number;
  createdBy?: User;
  title?: string;
  description?: string;
  content?: Record<string, string>;
  thumbnail?: string;
}

export const createDraftGallery = async (
  galleryData: CreateDraftGalleryRequest
): Promise<{ id: number }> => {
  return await apiRequest<{ id: number }>(
    '/galleries/draft',
    'POST',
    qs.stringify(galleryData)
  );
};

export const createGallery = async (
  galleryData: CreateGalleryRequest,
  galleryId: number
): Promise<Gallery> => {
  return await apiRequest<Gallery>(`/galleries/${galleryId}/content`, 'PUT', {
    content: galleryData,
  });
};

export const editGallery = async (
  galleryData: EditGalleryRequest,
  galleryId: number
): Promise<Gallery> => {
  return await apiRequest<Gallery>(
    `/galleries/${galleryId}`,
    'PATCH',
    qs.stringify(galleryData)
  );
};

export const deleteGallery = async (galleryId: number): Promise<Gallery> => {
  return await apiRequest<Gallery>(`/galleries/${galleryId}`, 'DELETE');
};

export const getGalleries = async (): Promise<Gallery[]> => {
  return await apiRequest<Gallery[]>('/galleries', 'GET');
};

export const getGallery = async (
  galleryId: string | undefined,
  mode?: 'edit'
): Promise<Gallery> => {
  return await apiRequest<Gallery>(
    `/galleries/${galleryId}`,
    'GET',
    undefined,
    { mode }
  );
};

export const deleteGalleryImages = async (
  deletedKeys: string[],
  galleryId: number
): Promise<Gallery> => {
  return await apiRequest<Gallery>(`/galleries/${galleryId}/images`, 'DELETE', {
    keys: deletedKeys,
  });
};

export async function fetchPresignedUrls(
  galleryId: number,
  paths: string[]
): Promise<{ presignedUrls: string[] }> {
  try {
    const response = await apiRequest<Record<string, string>>(
      `/galleries/${galleryId}/presigned-urls`,
      'POST',
      { paths }
    );

    const presignedUrlMap = response;

    if (
      typeof presignedUrlMap !== 'object' ||
      presignedUrlMap === null ||
      Array.isArray(presignedUrlMap)
    ) {
      throw new Error(
        'Invalid response: presignedUrls must be a Record<string, string>'
      );
    }

    // Ensure presignedUrls array is in the same order as paths
    const presignedUrls = paths.map((path) => {
      const url = presignedUrlMap[path];
      if (!url) {
        throw new Error(`Missing presigned URL for path: ${path}`);
      }
      return url;
    });

    return { presignedUrls };
  } catch (error) {
    console.error('Failed to fetch presigned URLs:', error);
    throw new Error('Could not get presigned URLs from server');
  }
}

export async function uploadFilesToS3(
  files: File[],
  presignedUrls: string[],
  paths: string[]
): Promise<void> {
  if (files.length !== presignedUrls.length || files.length !== paths.length) {
    throw new Error('Mismatch between files, URLs, and paths');
  }

  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const url = presignedUrls[i];

      await axios.put(url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
    } catch (error) {
      console.error(`Failed to upload file to S3 for path ${paths[i]}`, error);
      throw new Error(`S3 upload failed for file: ${files[i].name}`);
    }
  }
}
