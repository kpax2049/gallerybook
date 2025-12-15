import { webcrypto } from 'node:crypto';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const base64Png = 'data:image/png;base64,YWJj'; // "abc"

function ensureTestGlobals() {
  if (typeof globalThis.atob !== 'function') {
    globalThis.atob = (data: string) =>
      Buffer.from(data, 'base64').toString('binary');
  }
  if (typeof globalThis.btoa !== 'function') {
    globalThis.btoa = (data: string) =>
      Buffer.from(data, 'binary').toString('base64');
  }
  if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as unknown as Crypto;
  }
  if (typeof File === 'undefined') {
    class PolyfillFile extends Blob {
      name: string;
      lastModified: number;
      constructor(
        bits: BlobPart[],
        name: string,
        options?: FilePropertyBag | undefined
      ) {
        super(bits, options);
        this.name = name;
        this.lastModified = options?.lastModified ?? Date.now();
      }
    }
    // @ts-expect-error: assign to global for test environment
    globalThis.File = PolyfillFile;
  }
}

async function loadUtils() {
  vi.resetModules();
  process.env.VITE_S3_FOLDER = '';
  process.env.VITE_S3_DOMAIN = 'https://cdn.example/';
  ensureTestGlobals();
  return import('./utils');
}

describe('extractImagesFromPM', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('collects image nodes from nested prose-mirror JSON', async () => {
    const { extractImagesFromPM } = await loadUtils();
    const tree = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'hello' },
            { type: 'image', attrs: { src: 'one.png', alt: 'a1' } },
          ],
        },
        { type: 'image', attrs: { src: 'two.png', title: 'second' } },
      ],
    };

    const images = extractImagesFromPM(tree);

    expect(images).toEqual([
      { src: 'one.png', alt: 'a1', title: undefined },
      { src: 'two.png', alt: undefined, title: 'second' },
    ]);
  });
});

describe('extractBase64ImagesFromJson', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('converts base64 images into files and hashed S3 keys', async () => {
    const { extractBase64ImagesFromJson } = await loadUtils();
    const original = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: base64Png, alt: 'cover' } },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'body' }],
        },
      ],
    };

    const { imageFiles, paths, updatedJson } =
      await extractBase64ImagesFromJson(original, 7, 42);

    expect(imageFiles).toHaveLength(1);
    expect(imageFiles[0]).toBeInstanceOf(File);
    expect(imageFiles[0].type).toBe('image/png');
    expect(paths).toEqual([
      'users/7/galleries/42/a9993e364706816aba3e25717850c26c9cd0d89d.png',
    ]);
    expect(
      (updatedJson as any).content[0].attrs?.src
    ).toBe(paths[0]);

    // original JSON should stay untouched
    expect(original.content[0].attrs?.src).toBe(base64Png);
  });

  it('returns untouched content when no base64 images exist', async () => {
    const { extractBase64ImagesFromJson } = await loadUtils();
    const content = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: 'https://cdn.example/images/photo.png' },
        },
      ],
    };

    const result = await extractBase64ImagesFromJson(content, 1, 2);

    expect(result.imageFiles).toHaveLength(0);
    expect(result.paths).toHaveLength(0);
    expect(result.updatedJson).toEqual(content);
  });
});

describe('normalize helpers', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('normalizes flip attrs deeply', async () => {
    const { normalizeAttrs } = await loadUtils();
    const node = {
      type: 'image',
      attrs: { flipX: 'true', flipY: 'false' },
      content: [{ type: 'image', attrs: { flipX: 'false' } }],
    };

    const normalized = normalizeAttrs(node);

    expect(normalized.attrs?.flipX).toBe(true);
    expect(normalized.attrs?.flipY).toBe(false);
    expect(normalized.content?.[0].attrs?.flipX).toBe(false);
  });

  it('strips bucket prefix from image src nodes', async () => {
    const { normalizeImageSrcsToS3Keys } = await loadUtils();
    const content = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: 'https://cdn.example//images/pic.jpg' },
        },
        {
          type: 'image',
          attrs: { src: 'https://other.example/photo.png' },
        },
      ],
    };

    normalizeImageSrcsToS3Keys(content, 'https://cdn.example/');

    expect(content.content?.[0].attrs?.src).toBe('images/pic.jpg');
    expect(content.content?.[1].attrs?.src).toBe(
      'https://other.example/photo.png'
    );
  });

  it('extracts image keys from absolute and relative sources', async () => {
    const { extractImageKeysFromJSON } = await loadUtils();
    const json = {
      content: [
        {
          type: 'image',
          attrs: { src: 'https://cdn.example/assets/one.png' },
        },
        { type: 'image', attrs: { src: 'two.png' } },
        {
          content: [
            { type: 'image', attrs: { src: '/nested/three.jpg' } },
          ],
        },
      ],
    };

    const keys = extractImageKeysFromJSON(json);

    expect(keys).toEqual(
      new Set(['assets/one.png', 'two.png', 'nested/three.jpg'])
    );
  });
});
