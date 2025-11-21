import { extractS3KeysFromContent } from './gallery.utils';

describe('extractS3KeysFromContent', () => {
  it('collects every unique uploads key regardless of nesting', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: 'uploads/foo/bar.jpg' },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'image',
              attrs: { src: 'uploads/foo/bar.jpg' }, // duplicate should be deduped
            },
            {
              type: 'image',
              attrs: { src: 'uploads/another%20image.png' }, // encoded characters
            },
          ],
        },
      ],
    };

    expect(extractS3KeysFromContent(content)).toEqual([
      'uploads/foo/bar.jpg',
      'uploads/another image.png',
    ]);
  });

  it('ignores nodes that are not uploads images', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: 'https://example.com/not-s3.jpg' },
        },
        {
          type: 'span',
          content: [{ type: 'text', text: 'hello' }],
        },
      ],
    };

    expect(extractS3KeysFromContent(content)).toEqual([]);
  });
});
