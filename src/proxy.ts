import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GLORYBELLE — proxy.ts (Next 16 name for the former middleware.ts)
 * P1 fix #23 — handle route renames /shop → /prodotti (and /shop/{slug} → /prodotti/{slug}).
 * Permanent 308 redirect so existing bookmarks / SEO links keep working.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /shop → /prodotti
  // /shop/{slug} → /prodotti/{slug}
  if (pathname === '/shop' || pathname.startsWith('/shop/')) {
    const newPath = pathname.replace(/^\/shop/, '/prodotti');
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 308);  // 308 = permanent, preserve method
  }

  // /conferma → /checkout/conferma
  if (pathname === '/conferma' || pathname.startsWith('/conferma/')) {
    const newPath = pathname.replace(/^\/conferma/, '/checkout/conferma');
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const nonce = randomBytes(16).toString('base64');
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.headers.set('X-Robots-Tag', 'noindex');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/shop/:path*', '/conferma/:path*', '/admin', '/admin/:path*'],
};
