import { expect, test } from '@playwright/test';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  auth,
  clearAuthTokens,
  setAccessToken,
} from '../src/lib/api';

const REFRESH_ENDPOINT = '/api/accounts/token/refresh/';

function installBrowserStorage(initial: Record<string, string>) {
  const values = new Map(Object.entries(initial));
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
    removeItem: (key: string) => { values.delete(key); },
  };
  const windowStub = {
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  };

  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: windowStub });

  return () => {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('concurrent authenticated 401s share one refresh and retry with rotated tokens', async () => {
  const restoreBrowser = installBrowserStorage({
    [ACCESS_TOKEN_KEY]: 'expired-access',
    [REFRESH_TOKEN_KEY]: 'old-refresh',
  });
  const originalFetch = globalThis.fetch;
  let refreshCalls = 0;
  setAccessToken('expired-access');
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname === REFRESH_ENDPOINT) {
      refreshCalls += 1;
      return jsonResponse({ access: 'new-access', refresh: 'new-refresh' });
    }
    if (url.pathname === '/api/accounts/me/') {
      const authorization = new Headers(init?.headers).get('authorization');
      return authorization === 'Bearer new-access'
        ? jsonResponse({ id: 1, username: 'test', email: 'test@example.com' })
        : jsonResponse({ detail: 'Token is invalid or expired' }, 401);
    }
    throw new Error(`Unexpected API request: ${url.pathname}`);
  };

  try {
    const [first, second] = await Promise.all([auth.me(), auth.me()]);
    expect(first.id).toBe(1);
    expect(second.id).toBe(1);
    expect(refreshCalls).toBe(1);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('new-access');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-refresh');
  } finally {
    clearAuthTokens();
    setAccessToken(null);
    globalThis.fetch = originalFetch;
    restoreBrowser();
  }
});

test('login and registration 401s do not trigger token refresh', async () => {
  const restoreBrowser = installBrowserStorage({
    [ACCESS_TOKEN_KEY]: 'expired-access',
    [REFRESH_TOKEN_KEY]: 'old-refresh',
  });
  const originalFetch = globalThis.fetch;
  let refreshCalls = 0;
  setAccessToken('expired-access');
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === REFRESH_ENDPOINT) refreshCalls += 1;
    return jsonResponse({ detail: 'Unauthorized' }, 401);
  };

  try {
    await expect(auth.login('test@example.com', 'wrong')).rejects.toMatchObject({ status: 401 });
    await expect(auth.register({ username: 'test', email: 'test@example.com' })).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls).toBe(0);
  } finally {
    clearAuthTokens();
    setAccessToken(null);
    globalThis.fetch = originalFetch;
    restoreBrowser();
  }
});
