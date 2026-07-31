import {
  createEmptyGalleryDocument,
  normalizeGalleryDocument,
  parseGalleryDocumentInput,
  ProseMirrorDocSchema,
} from './prosemirror.schema';

describe('ProseMirror gallery documents', () => {
  const document = {
    type: 'doc' as const,
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [
          {
            type: 'text',
            text: 'Summer',
            marks: [{ type: 'bold' }],
          },
        ],
      },
      {
        type: 'image',
        attrs: {
          src: 'uploads/users/1/galleries/2/photo.jpg',
          flipX: false,
        },
      },
    ],
  };

  it('accepts recursively structured TipTap documents', () => {
    expect(ProseMirrorDocSchema.safeParse(document).success).toBe(true);
  });

  it.each([
    null,
    {},
    { type: 'content', content: [{ type: 'paragraph' }] },
    { type: 'doc', content: [] },
    { type: 'doc', content: [{ attrs: {} }] },
    { type: 'doc', content: [{ type: ' paragraph ' }] },
    { type: 'doc', content: [{ type: 'text' }] },
    { type: 'doc', content: [{ type: 'paragraph', text: 'invalid' }] },
  ])('rejects malformed write input %#', (value) => {
    expect(ProseMirrorDocSchema.safeParse(value).success).toBe(false);
  });

  it('parses legacy JSON strings before validation', () => {
    expect(parseGalleryDocumentInput(JSON.stringify(document))).toEqual(
      document,
    );
    expect(parseGalleryDocumentInput('{bad json')).toBe('{bad json');
  });

  it('normalizes legacy array roots and empty or malformed values', () => {
    expect(normalizeGalleryDocument(document.content)).toEqual(document);

    for (const value of [null, '', {}, { type: 'doc', content: [] }]) {
      expect(normalizeGalleryDocument(value)).toEqual(
        createEmptyGalleryDocument(),
      );
    }
  });
});
