import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public: home + recipes browsing + auth pages
const isPublicRoute = createRouteMatcher([
  '/',
  '/recipes(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
]);

// Protected: personal / interactive features require login
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};
