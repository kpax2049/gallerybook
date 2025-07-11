export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  active,
  inactive,
}

export const ReadableRoles = new Map<unknown, string>([
  ['USER', 'User'],
  ['ADMIN', 'Administrator'],
]);
