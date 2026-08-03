import { describe, expect, it } from 'vitest';
import {
  accountEmailSchema,
  accountProfileSchema,
  ACCOUNT_FULL_NAME_MAX_LENGTH,
  ACCOUNT_USERNAME_MAX_LENGTH,
} from './accountValidation';

describe('account validation', () => {
  it('normalizes account fields', () => {
    expect(accountEmailSchema.parse('  USER@Example.COM ')).toBe(
      'user@example.com'
    );
    expect(
      accountProfileSchema.parse({
        fullName: '  Example User  ',
        username: '  example-user  ',
      })
    ).toEqual({
      fullName: 'Example User',
      username: 'example-user',
    });
  });

  it('rejects blank and oversized profile fields', () => {
    expect(
      accountProfileSchema.safeParse({ fullName: '   ', username: 'ab' })
        .success
    ).toBe(false);
    expect(
      accountProfileSchema.safeParse({
        fullName: 'x'.repeat(ACCOUNT_FULL_NAME_MAX_LENGTH + 1),
        username: 'x'.repeat(ACCOUNT_USERNAME_MAX_LENGTH + 1),
      }).success
    ).toBe(false);
  });
});
