'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth as authApi, setAccessToken } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; first_name?: string; last_name?: string; birth_date?: string; password_confirm: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACCESS_TOKEN_KEY = 'gb_access_token';
const REFRESH_TOKEN_KEY = 'gb_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load access token from storage on mount and verify with /me/
  useEffect(() => {
    const init = async () => {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;
      if (token) {
        setAccessToken(token);            // without this the API client sends no Authorization header
        try {
          const me = await authApi.me();
          setUser(me);
        } catch {
          setAccessToken(null);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    setAccessToken(tokens.access);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const register = useCallback(async (data: { username: string; email: string; password: string; first_name?: string; last_name?: string; birth_date?: string; password_confirm: string }) => {
    await authApi.register(data);
    // After register, auto-login
    await login(data.email, data.password);
  }, [login]);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) {
      try {
        // Goes through apiFetch so the Bearer token is attached — the endpoint
        // requires authentication, otherwise the refresh token is never revoked.
        await authApi.logout(refresh);
      } catch {
        // Logout API call failed — clear tokens locally anyway
      }
    }
    setAccessToken(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
