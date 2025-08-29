'use client';

import { createContext } from 'react';
import type { User } from '../lib/types';
import type { LoginCredentials, RegisterCredentials } from '@/providers/AuthProvider';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
  isAuthLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateCurrentUser: () => {},
  isAuthLoading: true,
});
