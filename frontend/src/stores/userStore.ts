import { User } from '@/api/user';
import { create } from 'zustand';

type UserStore = {
  user: User | undefined;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: undefined,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: undefined }),
}));
