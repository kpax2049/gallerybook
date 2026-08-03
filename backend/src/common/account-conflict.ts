import { ConflictException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const ACCOUNT_UNIQUE_FIELDS = ['email', 'username'] as const;
type AccountUniqueField = (typeof ACCOUNT_UNIQUE_FIELDS)[number];

export function throwAccountConflict(error: unknown): never {
  if (
    !(error instanceof PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    throw error;
  }

  const field = getAccountUniqueField(error.meta?.target);
  if (!field) {
    throw new ConflictException('Email or username is already in use.');
  }

  const label = field === 'email' ? 'Email' : 'Username';
  throw new ConflictException({
    field,
    message: `${label} is already in use.`,
  });
}

function getAccountUniqueField(
  target: unknown,
): AccountUniqueField | undefined {
  const targets = Array.isArray(target) ? target : [target];

  return ACCOUNT_UNIQUE_FIELDS.find((field) =>
    targets.some((value) => typeof value === 'string' && value.includes(field)),
  );
}
