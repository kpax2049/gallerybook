/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const S3_FOLDER = import.meta.env.VITE_S3_FOLDER;
const S3_URL = import.meta.env.VITE_S3_DOMAIN;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertISOtoReadableDate(updatedAt: Date) {
  const date = new Date(updatedAt);
  const result = date.toLocaleString('en-GB', {
    // you can use undefined as first argument
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return result;
}

export type ExtractedImage = {
  originalPath: string; // original base64 src
  file: File;
  mimeType: string;
};

export async function extractBase64ImagesFromJson(
  json: any,
  userId: number,
  galleryId: number
): Promise<{ imageFiles: File[]; paths: string[]; updatedJson: any }> {
  const imageFiles: File[] = [];
  const paths: string[] = [];

  let index = 0;

  async function traverse(node: any): Promise<any> {
    if (
      node.type === 'image' &&
      typeof node.attrs?.src === 'string' &&
      node.attrs.src.startsWith('data:image/')
    ) {
      const base64 = node.attrs.src;
      const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
      if (!match) return node;

      const [, mimeType, base64Data] = match;
      const binary = atob(base64Data);
      const array = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const file = new File([array], `image-${index}.bin`, { type: mimeType });
      const hash = await hashFile(file);
      const ext = mimeToExt(mimeType) || 'bin';
      const path = `${S3_FOLDER}users/${userId}/galleries/${galleryId}/${hash}.${ext}`;

      imageFiles.push(file);
      paths.push(path);
      index += 1;

      return {
        ...node,
        attrs: {
          ...node.attrs,
          src: path, // now already a final S3 path
        },
      };
    }

    if (node.content) {
      const newContent = await Promise.all(node.content.map(traverse));
      return { ...node, content: newContent };
    }

    return node;
  }

  const updatedJson = await traverse(json);
  return { imageFiles, paths, updatedJson };
}

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function mimeToExt(mime: string): string | null {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[mime] || null;
}

export const normalizeAttrs = (node: any): any => {
  if (node.attrs) {
    if (typeof node.attrs.flipX === 'string') {
      node.attrs.flipX = node.attrs.flipX === 'true';
    }
    if (typeof node.attrs.flipY === 'string') {
      node.attrs.flipY = node.attrs.flipY === 'true';
    }
  }

  if (node.content && Array.isArray(node.content)) {
    node.content = node.content.map(normalizeAttrs);
  }

  return node;
};

export function normalizeImageSrcsToS3Keys(
  content: any,
  bucketBaseUrl: string = S3_URL
): void {
  function walk(node: any) {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'image' && typeof node.attrs?.src === 'string') {
      const src = node.attrs.src;
      try {
        const url = new URL(src);

        if (url.href.startsWith(bucketBaseUrl)) {
          const key = url.pathname.replace(/^\/+/, ''); // removes leading slashes
          node.attrs.src = key;
        }
      } catch {
        // Not a valid URL — assume it's already a relative key or ignore
      }
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    } else if (typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  }

  walk(content);
}

export function extractImageKeysFromJSON(json: any): Set<string> {
  const keys = new Set<string>();

  const walk = (node: any) => {
    if (typeof node !== 'object' || node === null) return;

    if (node.type === 'image' && node.attrs?.src) {
      const src = node.attrs.src;
      // Extract the S3 key from the src URL (after domain)
      const url = new URL(src);
      const key = url.pathname.slice(1); // remove leading '/'
      keys.add(key);
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    } else if (typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  };

  walk(json);
  return keys;
}
