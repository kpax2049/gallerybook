export type User = {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  email: string;
  fullName?: string;
  username: string;
  profile: Profile;
};

export interface Profile {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  avatarUrl?: string;
  userId: number;
  configuration?: { [key: string]: unknown }[];
}
