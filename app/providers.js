'use client';

// Client-only context wrapper: React Query + Google sign-in context (server flow in /api/auth/google).

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

const LOGIN_ERRORS = {
  not_configured: 'Login Google belum dikonfigurasi di server.',
  denied: 'Login Google dibatalkan.',
  invalid_state: 'Sesi login tidak valid, silakan coba lagi.',
  db_missing: 'Database belum terhubung, login belum bisa digunakan.',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      setUser(data.user || null);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginError = params.get('login_error');
    if (loginError) {
      toast.error(LOGIN_ERRORS[loginError] || 'Login Google gagal, silakan coba lagi.');
      window.history.replaceState(null, '', window.location.pathname);
    }
    refresh();
  }, [refresh]);

  const login = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
