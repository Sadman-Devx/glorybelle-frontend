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

  return NextResponse.next();
}

export const config = {
  // Only run the proxy on /shop and /conferma paths (cheap)
  matcher: ['/shop/:path*', '/conferma/:path*'],
};
