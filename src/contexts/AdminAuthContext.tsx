'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  AdminApiError,
  adminApi,
  type AdminMfaChallenge,
  type AdminMfaResult,
  type AdminUser,
} from '@/lib/adminApi';

interface AdminAuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  sessionExpired: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<AdminMfaChallenge>;
  verifyMfa: (challenge: string, code: string) => Promise<AdminMfaResult>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  retry: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setAuthError(null);
    try {
      setUser(await adminApi.me());
    } catch (error) {
      setUser(null);
      if (error instanceof AdminApiError && error.status === 401) {
        if (window.location.pathname !== '/admin/login') setSessionExpired(true);
      } else {
        setAuthError('Non è stato possibile verificare la sessione. Riprova.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (
        window.location.pathname === '/admin/login'
        && new URLSearchParams(window.location.search).get('expired') === '1'
      ) {
        setSessionExpired(true);
      }
      void loadUser();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUser]);

  const retry = useCallback(async () => {
    setLoading(true);
    await loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null);
      if (window.location.pathname !== '/admin/login') setSessionExpired(true);
      setAuthError(null);
      setLoading(false);
    };
    window.addEventListener('admin:session-expired', handleExpiredSession);
    return () => window.removeEventListener('admin:session-expired', handleExpiredSession);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    return adminApi.login(email, password);
  }, []);

  const verifyMfa = useCallback(async (challenge: string, code: string) => {
    setAuthError(null);
    const result = await adminApi.verifyMfa(challenge, code);
    setUser(result.user);
    setSessionExpired(false);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setUser(null);
      setSessionExpired(false);
    }
  }, []);

  const logoutEverywhere = useCallback(async () => {
    try {
      await adminApi.logoutEverywhere();
    } finally {
      setUser(null);
      setSessionExpired(false);
    }
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        sessionExpired,
        authError,
        login,
        verifyMfa,
        logout,
        logoutEverywhere,
        retry,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth deve essere usato dentro AdminAuthProvider.');
  return context;
}
