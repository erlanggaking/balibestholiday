// ============================================================
// Admin authorization helper — reusable across all /admin pages & APIs
// ============================================================
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';
import type { Session } from 'next-auth';

export type AdminSession = Session & {
  user: NonNullable<Session['user']> & { id: string; role: string };
};

/**
 * Server-side guard for admin pages.
 * Redirects to /auth/signin if not logged in, or to / if logged in but not admin/staff.
 * Returns the session for use in the page (typed with role).
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin');
  }
  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'STAFF') {
    redirect('/');
  }
  return session as AdminSession;
}

/**
 * For API routes — returns 401/403 instead of redirecting.
 */
export async function requireAdminApi(): Promise<
  { ok: true; session: AdminSession } | { ok: false; status: number; message: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, status: 401, message: 'Not signed in' };
  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'STAFF') {
    return { ok: false, status: 403, message: 'Admin access required' };
  }
  return { ok: true, session: session as AdminSession };
}

export function isFullAdmin(session: AdminSession | null | undefined): boolean {
  return session?.user?.role === 'ADMIN';
}
