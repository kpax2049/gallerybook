import { User } from '@/api/user';
import { UserRole } from '@/common/enums';

export const isAdmin = (u?: User | null): boolean => u?.role === UserRole.ADMIN;
export const isOwner = (u?: User | null, ownerId?: number | string): boolean =>
  !!u && Number(u.id) === Number(ownerId);

export const canEditTags = (
  u?: User | null,
  ownerId?: number | string
): boolean =>
  !!u && (u.role === UserRole.ADMIN || Number(u.id) === Number(ownerId));
