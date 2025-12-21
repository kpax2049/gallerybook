import { describe, expect, it } from 'vitest';
import { serializeParams } from './apiClient';

describe('serializeParams', () => {
  it('drops empty values and joins arrays', () => {
    const result = serializeParams({
      empty: '',
      nil: null,
      undef: undefined,
      tags: ['a', 'b'],
      statuses: [],
      page: 2,
      favorite: false,
    });

    expect(result).toEqual({
      tags: 'a,b',
      page: 2,
      favorite: false,
    });
  });

  it('stringifies booleans without changing strings/numbers', () => {
    const result = serializeParams({
      hasCover: true,
      owner: 'me',
      count: 5,
    });

    expect(result).toEqual({
      hasCover: true,
      owner: 'me',
      count: 5,
    });
  });
});
