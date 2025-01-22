import { Role, UserStatus } from './enums';

export interface User {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  email: string;
  hash: string;
  firstName?: string;
  lastName?: string;
  settings: { [key: string]: unknown }[];
  status: UserStatus;
  //   profile?: Profile,
  galleries: Gallery[];
}

export interface Gallery {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  createdBy: User;
  title: string;
  description?: string;
  //   images: Image[];
}
