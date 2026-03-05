import { type NextRequest, NextResponse } from 'next/server';
import { getTokens } from 'next-firebase-auth-edge';
import { AUTH_EDGE_CONFIG } from './lib/auth-edge.js';
import type { UserRole } from '@shinebuild/shared';

// Role routing map: path prefix → allowed roles
const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/agent': ['agent'],
  '/admin': ['admin', 'superadmin'],
  '/staff': ['staff'],
  '/superadmin': ['superadmin'],
};

const PUBLIC_PATHS = ['/', '/login', '/qr', '/agent/register', '/agent/pending', '/api/health'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (isPublicPath(pathname)) return NextResponse.next();

  // Determine required roles for this route
  let requiredRoles: UserRole[] | null = null;
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      requiredRoles = roles;
      break;
    }
  }

  // No role restriction — allow
  if (!requiredRoles) return NextResponse.next();

  let tokens = null;
  try {
    tokens = await getTokens(request.cookies, AUTH_EDGE_CONFIG);
  } catch {
    // invalid token — redirect to login
  }

  if (!tokens) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { decodedToken } = tokens;
  const role = decodedToken['role'] as UserRole | undefined;
  const status = decodedToken['status'] as string | undefined;

  if (!role || !requiredRoles.includes(role)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Agent-specific: must be approved
  if (role === 'agent' && status !== 'approved' && !pathname.startsWith('/agent/pending')) {
    return NextResponse.redirect(new URL('/agent/pending', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)',
  ],
};
