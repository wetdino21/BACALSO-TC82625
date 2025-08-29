'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import type { User } from '@/lib/types';
import apiFetch from '@/lib/api';

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface RegisterCredentials extends LoginCredentials {
  mantra: string;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setAuthLoading] = useState(true);

  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const user = await apiFetch('/auth/me', { token: authToken });
      setCurrentUser(user);
      setToken(authToken);
    } catch (error) {
      console.error("Failed to fetch current user", error);
      // Token is invalid, clear it
      logout();
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('tripvaler-token');
    if (storedToken) {
      fetchCurrentUser(storedToken);
    } else {
      setAuthLoading(false);
    }
  }, [fetchCurrentUser]);

  const handleAuthSuccess = (data: { user: User; token: string }) => {
    setCurrentUser({
      ...data.user,
      bioPhoto: data.user.bioPhoto // now already a data URL
    });

    setToken(data.token);
    localStorage.setItem('tripvaler-token', data.token);
  };

  const login = async (credentials: LoginCredentials) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Convert bioPhoto buffer (if exists) to data URL
    let bioPhotoDataUrl: string | null = null;
    if (data.user?.bioPhoto) {
      // If server sends a raw object with "type: Buffer" and "data" array
      const bufferData = data.user.bioPhoto.data;
      const base64 = Buffer.from(bufferData).toString('base64');
      bioPhotoDataUrl = `data:image/png;base64,${base64}`;
    }

    handleAuthSuccess({
      user: {
        ...data.user,
        bioPhoto: bioPhotoDataUrl,
      },
      token: data.token,
    });
  };

  const register = async (credentials: RegisterCredentials) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    handleAuthSuccess(data);
  }

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('tripvaler-token');
  }, []);

  const updateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ currentUser, token, login, register, logout, updateCurrentUser, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
