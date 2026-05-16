import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PREFIXES = ['/onboarding', '/sign-in', '/sign-up', '/recipes', '/ingredients'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
  const done = req.cookies.has('onboarding_done');

  if (!isPublic && !done) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};
