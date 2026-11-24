import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'gb_admin_session';
const SESSION_TTL_SECONDS = 60 * 30;
const SESSION_CIPHER = 'aes-256-gcm';
const ADMIN_API_SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

interface AdminSession {
  access: string;
  refresh: string;
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function sessionKey(): Buffer {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !/^[\da-f]{64}$/i.test(secret)) {
    throw new Error('ADMIN_SESSION_SECRET must be a 32-byte hexadecimal secret.');
  }
  return Buffer.from(secret, 'hex');
}

function sealSession(session: AdminSession): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(SESSION_CIPHER, sessionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), 'utf8'),
    cipher.final(),
  ]);
  return [
    iv.toString('base64url'),
    encrypted.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
  ].join('.');
}

function openSession(value: string): AdminSession | null {
  try {
    const [ivValue, encryptedValue, tagValue] = value.split('.');
    if (!ivValue || !encryptedValue || !tagValue) return null;
    const decipher = createDecipheriv(
      SESSION_CIPHER,
      sessionKey(),
      Buffer.from(ivValue, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    const session = JSON.parse(plaintext) as Partial<AdminSession>;
    if (typeof session.access !== 'string' || typeof session.refresh !== 'string') return null;
    return { access: session.access, refresh: session.refresh };
  } catch {
    return null;
  }
}

function backendBaseUrl(): string {
  const baseUrl = process.env.ADMIN_API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return baseUrl.replace(/\/+$/, '');
}

function backendUrl(path: string): string {
  return `${backendBaseUrl()}/api/admin/${path}`;
}

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      ...ADMIN_API_SECURITY_HEADERS,
    },
  });
}

function requestIsSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return origin !== null && origin === request.nextUrl.origin;
}

async function setSession(session: AdminSession) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sealSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin',
    maxAge: SESSION_TTL_SECONDS,
  });
}

async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin',
    maxAge: 0,
  });
}

async function readSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  return cookie ? openSession(cookie) : null;
}

async function upstream(path: string, init: RequestInit): Promise<Response> {
  return fetch(backendUrl(path), {
    ...init,
    cache: 'no-store',
    redirect: 'manual',
  });
}

async function handleLogin(request: NextRequest): Promise<Response> {
  if (!requestIsSameOrigin(request)) {
    return jsonResponse({ error: { detail: 'Richiesta non consentita.' } }, 403);
  }

  const body = await request.text();
  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = JSON.parse(body) as typeof credentials;
  } catch {
    return jsonResponse({ error: { detail: 'Richiesta non valida.' } }, 400);
  }
  if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
    return jsonResponse({ error: { detail: 'Richiesta non valida.' } }, 400);
  }

  try {
    const loginResponse = await upstream('login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!loginResponse.ok) {
      return new Response(loginResponse.body, {
        status: loginResponse.status,
        headers: {
          'Content-Type': loginResponse.headers.get('Content-Type') || 'application/json',
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex',
          ...ADMIN_API_SECURITY_HEADERS,
        },
      });
    }

    const loginData = (await loginResponse.json()) as {
      mfa_required?: unknown;
      purpose?: unknown;
      challenge?: unknown;
      secret?: unknown;
      provisioning_uri?: unknown;
      access?: unknown;
      refresh?: unknown;
    };
    if (
      loginData.mfa_required === true
      && typeof loginData.challenge === 'string'
      && (loginData.purpose === 'enroll' || loginData.purpose === 'verify')
    ) {
      return jsonResponse(loginData);
    }
    if (typeof loginData.access !== 'string' || typeof loginData.refresh !== 'string') {
      return jsonResponse({ error: { detail: 'Risposta di autenticazione non valida.' } }, 502);
    }

    const meResponse = await upstream('me/', {
      headers: { Authorization: `Bearer ${loginData.access}` },
    });
    if (!meResponse.ok) {
      return jsonResponse({ error: { detail: 'Non è stato possibile verificare l’account.' } }, 502);
    }

    const adminUser: unknown = await meResponse.json();
    await setSession({ access: loginData.access, refresh: loginData.refresh });
    return jsonResponse(adminUser);
  } catch (error) {
    console.error('Admin authentication service unavailable.', error);
    return jsonResponse({ error: { detail: 'Servizio di autenticazione non disponibile.' } }, 502);
  }
}

async function handleMfaVerify(request: NextRequest): Promise<Response> {
  if (!requestIsSameOrigin(request)) {
    return jsonResponse({ error: { detail: 'Richiesta non consentita.' } }, 403);
  }
  const body = await request.text();
  try {
    const response = await upstream('mfa/verify/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!response.ok) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex',
          ...ADMIN_API_SECURITY_HEADERS,
        },
      });
    }
    const data = (await response.json()) as {
      access?: unknown;
      refresh?: unknown;
      recovery_codes?: unknown;
    };
    if (typeof data.access !== 'string' || typeof data.refresh !== 'string') {
      return jsonResponse({ error: { detail: 'Risposta di autenticazione non valida.' } }, 502);
    }
    const meResponse = await upstream('me/', {
      headers: { Authorization: `Bearer ${data.access}` },
    });
    if (!meResponse.ok) {
      return jsonResponse({ error: { detail: 'Non è stato possibile verificare l’account.' } }, 502);
    }
    await setSession({ access: data.access, refresh: data.refresh });
    return jsonResponse({
      user: await meResponse.json(),
      ...(Array.isArray(data.recovery_codes) ? { recovery_codes: data.recovery_codes } : {}),
    });
  } catch (error) {
    console.error('Admin MFA service unavailable.', error);
    return jsonResponse({ error: { detail: 'Servizio di autenticazione non disponibile.' } }, 502);
  }
}

async function authenticatedUpstream(
  path: string,
  init: RequestInit,
  session: AdminSession,
): Promise<{ response: Response; session: AdminSession | null }> {
  const sendRequest = (access: string) =>
    upstream(path, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init.headers).entries()),
        Authorization: `Bearer ${access}`,
      },
    });

  const response = await sendRequest(session.access);
  if (response.status !== 401) return { response, session };

  const refreshResponse = await upstream('token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: session.refresh }),
  });
  if (!refreshResponse.ok) return { response, session: null };

  const tokens = (await refreshResponse.json()) as Partial<AdminSession>;
  if (typeof tokens.access !== 'string' || typeof tokens.refresh !== 'string') {
    return { response, session: null };
  }
  const rotatedSession = { access: tokens.access, refresh: tokens.refresh };
  return { response: await sendRequest(rotatedSession.access), session: rotatedSession };
}

async function handleAuthenticated(
  request: NextRequest,
  upstreamPath: string,
  method: string,
): Promise<Response> {
  const session = await readSession();
  if (!session) {
    await clearSession();
    return jsonResponse({ error: { detail: 'Sessione amministrativa scaduta.' } }, 401);
  }

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') init.body = await request.arrayBuffer();

  try {
    const result = await authenticatedUpstream(upstreamPath, init, session);
    if (!result.session) {
      await clearSession();
      return jsonResponse({ error: { detail: 'Sessione amministrativa scaduta.' } }, 401);
    }
    await setSession(result.session);

    const responseHeaders = new Headers({
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      ...ADMIN_API_SECURITY_HEADERS,
    });
    const responseContentType = result.response.headers.get('Content-Type');
    if (responseContentType) responseHeaders.set('Content-Type', responseContentType);
    return new Response(result.response.body, {
      status: result.response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Admin API upstream request failed.', error);
    return jsonResponse({ error: { detail: 'Servizio amministrativo non disponibile.' } }, 502);
  }
}

async function handleRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const [action, ...segments] = path;
  const method = request.method.toUpperCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (isMutation && !requestIsSameOrigin(request)) {
    return jsonResponse({ error: { detail: 'Richiesta non consentita.' } }, 403);
  }

  if (action === 'login' && segments.length === 0 && method === 'POST') {
    return handleLogin(request);
  }
  if (action === 'mfa' && segments.length === 1 && segments[0] === 'verify' && method === 'POST') {
    return handleMfaVerify(request);
  }
  if (action === 'logout' && segments.length === 0 && method === 'POST') {
    const response = await handleAuthenticated(request, 'logout/', method);
    await clearSession();
    return response;
  }
  if (action === 'logout-everywhere' && segments.length === 0 && method === 'POST') {
    const response = await handleAuthenticated(request, 'logout-everywhere/', method);
    await clearSession();
    return response;
  }
  if (action === 'me' && segments.length === 0 && method === 'GET') {
    return handleAuthenticated(request, 'me/', method);
  }
  if (
    action !== 'proxy'
    || segments.length === 0
    || segments.some((segment) => !/^[\w.-]+$/.test(segment))
    || segments[0] === 'login'
    || segments[0] === 'token'
  ) {
    return jsonResponse({ error: { detail: 'Risorsa non trovata.' } }, 404);
  }
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return jsonResponse({ error: { detail: 'Metodo non consentito.' } }, 405);
  }

  const query = request.nextUrl.search;
  return handleAuthenticated(
    request,
    `${segments.join('/')}/${query}`,
    method,
  );
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
