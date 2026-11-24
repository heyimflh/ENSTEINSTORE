/**
 * ENSTEINSTORE — Auth API functions
 */
import { api, setToken, clearToken, getToken } from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfileResponse, UpdateProfileRequest, ChangePasswordRequest } from '../types/api';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/login', data, { skipAuth: true });
  setToken(res.token);
  const userObj = {
    id: res.user?.id || res.userId || '',
    name: res.user?.fullName || res.name || res.email,
    email: res.user?.email || res.email,
    role: res.user?.role || res.role || 'CUSTOMER',
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('ensteinstore_user', JSON.stringify(userObj));
    localStorage.setItem(
      'ensteinstore_auth_user',
      JSON.stringify({
        name: userObj.name,
        email: userObj.email,
        phone: res.user?.phone || '',
        role: userObj.role,
        address: res.user?.address || '',
      })
    );
  }
  return res;
}

export async function register(data: RegisterRequest): Promise<{ message: string }> {
  return api.post<{ message: string }>('/api/auth/register', data, { skipAuth: true });
}

export async function logout(): Promise<void> {
  try {
    await api.post<void>('/api/auth/logout');
  } catch {
    // ignore logout errors — always clear local state
  } finally {
    clearToken();
  }
}

export async function getMyProfile(): Promise<UserProfileResponse> {
  return api.get<UserProfileResponse>('/api/me');
}

export async function updateMyProfile(data: UpdateProfileRequest): Promise<UserProfileResponse> {
  return api.put<UserProfileResponse>('/api/me', data);
}

export async function changeMyPassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  return api.put<{ message: string }>('/api/me/password', data);
}

export function getStoredUser(): { id: string; name: string; email: string; role: 'CUSTOMER' | 'ADMIN' } | null {
  if (typeof window === 'undefined') return null;
  if (!getToken()) {
    clearToken();
    return null;
  }
  const raw = localStorage.getItem('ensteinstore_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getToken();
}
