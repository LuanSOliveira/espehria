import { NextRequest, NextResponse } from 'next/server';
import { decodeToken } from '@/services/jwt';
import { NEXT_PUBLIC_AUTH_TOKEN_KEY } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';

const PUBLIC_PATHS: string[] = Object.values(APP_ROUTES.public);

function isTokenValid(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded.exp) {
      return false;
    }
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(NEXT_PUBLIC_AUTH_TOKEN_KEY ?? '')?.value;

  if (!token || !isTokenValid(token)) {
    const loginUrl = new URL(APP_ROUTES.public.login, request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isGoogleBlockedPath =
    pathname === APP_ROUTES.private.users ||
    pathname === APP_ROUTES.private.campaigns ||
    pathname.startsWith(`${APP_ROUTES.private.campaigns}/`);

  if (isGoogleBlockedPath) {
    const decoded = decodeToken(token);
    if (decoded.provider === 'google') {
      const homeUrl = new URL(APP_ROUTES.private.home, request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)',
  ],
};
