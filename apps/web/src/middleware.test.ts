import { describe, it, expect } from 'vitest';

// Test the role routing logic in isolation (extracted from middleware)
const ROLE_ROUTES: Record<string, string[]> = {
  '/agent': ['agent'],
  '/admin': ['admin', 'superadmin'],
  '/staff': ['staff'],
  '/superadmin': ['superadmin'],
};

const PUBLIC_PATHS = ['/', '/login', '/qr', '/agent/register', '/agent/pending', '/api/health'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) return roles;
  }
  return null;
}

describe('Middleware role routing', () => {
  it('allows / as public', () => expect(isPublicPath('/')).toBe(true));
  it('allows /login as public', () => expect(isPublicPath('/login')).toBe(true));
  it('allows /agent/register as public', () => expect(isPublicPath('/agent/register')).toBe(true));
  it('allows /agent/pending as public', () => expect(isPublicPath('/agent/pending')).toBe(true));
  it('allows /qr/abc123 as public', () => expect(isPublicPath('/qr/abc123')).toBe(true));
  it('allows /api/health as public', () => expect(isPublicPath('/api/health')).toBe(true));

  it('requires agent role for /agent/dashboard', () =>
    expect(getRequiredRoles('/agent/dashboard')).toEqual(['agent']));
  it('requires admin or superadmin for /admin/leads', () =>
    expect(getRequiredRoles('/admin/leads')).toEqual(['admin', 'superadmin']));
  it('requires staff for /staff/dashboard', () =>
    expect(getRequiredRoles('/staff/dashboard')).toEqual(['staff']));
  it('requires superadmin for /superadmin/reports', () =>
    expect(getRequiredRoles('/superadmin/reports')).toEqual(['superadmin']));
  it('returns null for unknown route', () =>
    expect(getRequiredRoles('/unknown')).toBeNull());
});
