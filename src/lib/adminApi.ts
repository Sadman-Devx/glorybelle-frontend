export type AdminRole = 'superuser' | 'manager' | 'viewer';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
}

export interface AdminMfaChallenge {
  mfa_required: true;
  purpose: 'enroll' | 'verify';
  challenge: string;
  secret?: string;
  provisioning_uri?: string;
}

export interface AdminMfaResult {
  user: AdminUser;
  recovery_codes?: string[];
}

export interface AdminApiErrorPayload {
  error?: {
    code?: string;
    detail?: string;
  };
  detail?: string;
}

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: AdminApiErrorPayload | null,
  ) {
    super(data?.error?.detail ?? data?.detail ?? 'Richiesta non riuscita.');
    this.name = 'AdminApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  notifyUnauthorized = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/admin/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    let data: AdminApiErrorPayload | null = null;
    try {
      data = JSON.parse(body) as AdminApiErrorPayload;
    } catch {
      data = null;
    }

    if (response.status === 401 && notifyUnauthorized && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('admin:session-expired'));
    }
    throw new AdminApiError(response.status, data);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<AdminMfaChallenge>(
      'login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    ),
  verifyMfa: (challenge: string, code: string) =>
    request<AdminMfaResult>(
      'mfa/verify',
      {
        method: 'POST',
        body: JSON.stringify({ challenge, code }),
      },
      false,
    ),
  me: () => request<AdminUser>('me'),
  logout: () => request<void>('logout', { method: 'POST' }, false),
  logoutEverywhere: () =>
    request<void>('logout-everywhere', { method: 'POST' }, false),
  request,
};
