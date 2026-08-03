import { z } from 'zod';

export const ACCOUNT_EMAIL_MAX_LENGTH = 320;
export const ACCOUNT_FULL_NAME_MAX_LENGTH = 100;
export const ACCOUNT_USERNAME_MIN_LENGTH = 3;
export const ACCOUNT_USERNAME_MAX_LENGTH = 30;

export const accountEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(ACCOUNT_EMAIL_MAX_LENGTH, {
    message: `Email must be at most ${ACCOUNT_EMAIL_MAX_LENGTH} characters.`,
  })
  .email('This is not a valid email.');

export const accountFullNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Name is required.' })
  .max(ACCOUNT_FULL_NAME_MAX_LENGTH, {
    message: `Name must be at most ${ACCOUNT_FULL_NAME_MAX_LENGTH} characters.`,
  });

export const accountUsernameSchema = z
  .string()
  .trim()
  .min(ACCOUNT_USERNAME_MIN_LENGTH, {
    message: `Username must be at least ${ACCOUNT_USERNAME_MIN_LENGTH} characters.`,
  })
  .max(ACCOUNT_USERNAME_MAX_LENGTH, {
    message: `Username must be at most ${ACCOUNT_USERNAME_MAX_LENGTH} characters.`,
  });

export const accountProfileSchema = z.object({
  fullName: accountFullNameSchema,
  username: accountUsernameSchema,
});
