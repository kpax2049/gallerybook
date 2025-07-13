/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export async function extractBase64ImagesFromJSON(content: any) {
  const images: { path: string; file: File }[] = [];
  const walk = (node: any) => {
    if (node.type === 'image' && node.attrs?.src?.startsWith('data:image/')) {
      const { file, mime } = base64ToFile(node.attrs.src);
      const path = `image_${Date.now()}_${Math.random().toString(36).substring(2)}.${mime.split('/')[1]}`;
      images.push({ path, file });
      node.attrs.src = path; // temporary, will replace later with S3 URL
    }
    if (node.content) node.content.forEach(walk);
  };
  walk(content);
  return { valueWithPaths: content, images };
}

function base64ToFile(dataURL: string): { file: File; mime: string } {
  const [header, base64] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const array = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return {
    file: new File([array], 'upload.' + mime.split('/')[1], { type: mime }),
    mime,
  };
}
