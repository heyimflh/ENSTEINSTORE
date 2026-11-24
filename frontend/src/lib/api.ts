/**
 * ENSTEINSTORE API Layer — Centralized HTTP client
 * All frontend-to-backend communication MUST go through this module.
 * PRD Rule #2: Frontend communicates with backend exclusively through REST API.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─── K14 Error Format ───────────────────────────────────────────────────────
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
  fieldErrors?: { field: string; message: string }[];
}

export class ApiException extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly fieldErrors?: { field: string; message: string }[];

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.status = error.status;
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

// ─── Token helpers (localStorage, only called client-side) ──────────────────
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp) return false;
    // 5 seconds buffer
    return parsed.exp * 1000 <= Date.now() + 5000;
  } catch {
    return true;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token =
    localStorage.getItem('ensteinstore_jwt') ||
    localStorage.getItem('token') ||
    localStorage.getItem('ensteinstore_token');

  if (!token) return null;

  if (isTokenExpired(token)) {
    clearToken();
    return null;
  }

  return token;
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ensteinstore_jwt', token);
    localStorage.setItem('token', token);
  }
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ensteinstore_jwt');
    localStorage.removeItem('token');
    localStorage.removeItem('ensteinstore_token');
    localStorage.removeItem('ensteinstore_user');
    localStorage.removeItem('ensteinstore_auth_user');
  }
}

// ─── Core fetch wrapper ─────────────────────────────────────────────────────
interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth = false, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = {
        timestamp: new Date().toISOString(),
        status: res.status,
        error: res.statusText,
        code: 'HTTP_ERROR',
        message: `HTTP ${res.status}: ${res.statusText}`,
        path,
      };
    }

    if (res.status === 401 && !skipAuth) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired', { detail: { path } }));
      }
    }

    throw new ApiException(errorBody);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Public exports ──────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),

  put: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),

  patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),

  delete: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'DELETE', ...options }),

  /** Multipart/form-data upload (omits Content-Type so browser sets boundary) */
  upload: <T>(path: string, formData: FormData, options?: FetchOptions) => {
    const { skipAuth = false, ...rest } = options || {};
    const headers: Record<string, string> = {};
    if (!skipAuth) {
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
      headers,
      ...rest,
    }).then(async (res) => {
      if (!res.ok) {
        const err: ApiError = await res.json().catch(() => ({
          timestamp: new Date().toISOString(),
          status: res.status,
          error: res.statusText,
          code: 'UPLOAD_ERROR',
          message: `Upload failed: ${res.statusText}`,
          path,
        }));
        throw new ApiException(err);
      }
      return res.json() as Promise<T>;
    });
  },

  /** Stream download — returns a Blob */
  download: async (path: string): Promise<Blob> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return res.blob();
  },
};
