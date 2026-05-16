import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/recipes(.*)',
  '/ingredients(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};
