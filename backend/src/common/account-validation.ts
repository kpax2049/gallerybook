import { Transform } from 'class-transformer';

export const ACCOUNT_EMAIL_MAX_LENGTH = 320;
export const ACCOUNT_FULL_NAME_MAX_LENGTH = 100;
export const ACCOUNT_USERNAME_MIN_LENGTH = 3;
export const ACCOUNT_USERNAME_MAX_LENGTH = 30;

export function NormalizeEmail(): PropertyDecorator {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
}

export function TrimAccountText(): PropertyDecorator {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
