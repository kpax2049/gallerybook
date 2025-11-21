import { slugify } from './slug.util';

describe('slugify', () => {
  it('trims, lowercases, and replaces unsafe characters', () => {
    expect(slugify('  Hello  World!  ')).toBe('hello-world');
  });

  it('removes accent marks before slugifying', () => {
    expect(slugify('Crème Brûlée Été')).toBe('creme-brulee-ete');
  });

  it('falls back to "untitled" when nothing remains', () => {
    expect(slugify('___---***')).toBe('untitled');
    expect(slugify('')).toBe('untitled');
  });

  it('keeps numbers and collapses consecutive separators', () => {
    expect(slugify('Photo #123!!! Edition 2')).toBe('photo-123-edition-2');
  });
});
