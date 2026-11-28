'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  ACCESS_TOKEN_KEY,
  AUTH_SESSION_CLEARED_EVENT,
  REFRESH_TOKEN_KEY,
  auth as authApi,
  clearAuthTokens,
  setAccessToken,
  setAuthTokens,
} from '@/lib/api';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load access token from storage on mount and verify with /me/
  useEffect(() => {
    const handleSessionCleared = () => setUser(null);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY) {
        setAccessToken(event.newValue);
        if (!event.newValue) setUser(null);
      } else if (event.key === REFRESH_TOKEN_KEY && !event.newValue) {
        setAccessToken(null);
        setUser(null);
      }
    };
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    window.addEventListener('storage', handleStorage);

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
          clearAuthTokens();
        }
      }
      setLoading(false);
    };
    void init();
    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    setAuthTokens(tokens);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const register = useCallback(async (data: { username: string; email: string; password: string; first_name?: string; last_name?: string; birth_date?: string; password_confirm: string }) => {
    await authApi.register(data);
    // After register, auto-login
    await login(data.email, data.password);
  }, [login]);

  const logout = useCallback(async () => {
    if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
      try {
        // Goes through apiFetch so the Bearer token is attached — the endpoint
        // requires authentication, otherwise the refresh token is never revoked.
        await authApi.logout();
      } catch {
        // Logout API call failed — clear tokens locally anyway
      }
    }
    clearAuthTokens();
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
