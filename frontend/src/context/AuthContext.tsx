'use client';

/**
 * ENSTEINSTORE — AuthContext
 * Provides authentication state to all client components.
 * JWT stored in localStorage (acceptable for educational project).
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getStoredUser, isAuthenticated } from '../lib/auth-api';
import { clearToken } from '../lib/api';
import type { LoginRequest, RegisterRequest } from '../types/api';
import { register as apiRegister } from '../lib/auth-api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on mount only if token is valid and unexpired
    if (isAuthenticated()) {
      const stored = getStoredUser();
      if (stored) {
        setUser(stored as AuthUser);
      } else {
        clearToken();
        setUser(null);
      }
    } else {
      clearToken();
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Listen for centralized 401 token expiration events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await apiLogin(data);
    const userId = res.user?.id || res.userId || '';
    const name = res.user?.fullName || res.name || res.email || 'Pengguna';
    const email = res.user?.email || res.email || '';
    const role = res.user?.role || res.role || 'CUSTOMER';
    setUser({ id: userId, name, email, role });
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await apiRegister(data);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('ensteinstore_user', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.role === 'ADMIN',
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
