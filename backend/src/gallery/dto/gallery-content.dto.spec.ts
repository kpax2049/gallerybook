import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateGalleryDto } from './create-gallery.dto';
import { UpdateGalleryContentDto } from './update-gallery-content.dto';

describe('gallery content DTO validation', () => {
  const document = {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };

  it('parses and accepts a valid stringified document', async () => {
    const dto = plainToInstance(UpdateGalleryContentDto, {
      content: JSON.stringify(document),
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.content).toEqual(document);
  });

  it.each([
    null,
    {},
    { type: 'doc', content: [] },
    { type: 'doc', content: [{ type: 'text' }] },
  ])('rejects malformed documents %#', async (content) => {
    const dto = plainToInstance(UpdateGalleryContentDto, { content });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isGalleryDocument).toBe(
      'content must be a valid ProseMirror document',
    );
  });

  it('keeps content optional when creating gallery metadata', async () => {
    const dto = plainToInstance(CreateGalleryDto, { title: 'New gallery' });
    await expect(validate(dto)).resolves.toEqual([]);
  });
});
