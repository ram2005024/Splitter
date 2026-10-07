import { create } from "zustand";
import { User } from "@/types/api";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (accessToken: string, user?: User | null) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setInitializing: (isInitializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: (accessToken: string, user?: User | null) =>
    set({
      accessToken,
      user: user || null,
      isAuthenticated: true,
      isInitializing: false,
    }),

  setAccessToken: (accessToken: string) =>
    set({
      accessToken,
      isAuthenticated: !!accessToken,
    }),

  setUser: (user: User) =>
    set({
      user,
    }),

  clearAuth: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isInitializing: false,
    }),

  setInitializing: (isInitializing: boolean) =>
    set({
      isInitializing,
    }),
}));
