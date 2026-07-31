import { describe, expect, it } from 'vitest';
import {
  createEmptyGalleryDocument,
  normalizeGalleryDocument,
} from './galleryContent';

describe('normalizeGalleryDocument', () => {
  const document = {
    type: 'doc' as const,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Gallery story' }],
      },
    ],
  };

  it('preserves valid documents and wraps legacy array roots', () => {
    expect(normalizeGalleryDocument(document)).toEqual(document);
    expect(normalizeGalleryDocument(document.content)).toEqual(document);
    expect(normalizeGalleryDocument(JSON.stringify(document))).toEqual(
      document
    );
  });

  it.each([
    null,
    '',
    {},
    { type: 'doc', content: [] },
    { type: 'doc', content: [{ type: 'text' }] },
  ])('returns an empty document for malformed input %#', (value) => {
    expect(normalizeGalleryDocument(value)).toEqual(
      createEmptyGalleryDocument()
    );
  });
});
