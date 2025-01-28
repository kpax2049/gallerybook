import { User } from './user';

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
