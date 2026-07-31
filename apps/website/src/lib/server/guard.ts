import { error, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import {
  canAccessApp,
  hasPermission,
  permissionsFor,
  type AppId,
  type Permission,
  type Role
} from '@elmariam/auth';

const APP: AppId = 'website';

export type SessionUser = { id: string; email: string; userType: Role };

/**
 * The authenticated user, or a 401.
 *
 * Safe to call from inside remote functions — they are their own HTTP
 * endpoints and are NOT covered by `+layout.server.ts`, so every mutation must
 * guard itself.
 */
export function requireUser(): SessionUser {
  const { locals } = getRequestEvent();
  const user = locals.user;
  if (!user) error(401, 'Not authenticated');
  return user as SessionUser;
}

/** The authenticated user, or a 403 unless they hold every listed permission. */
export function requirePermission(...permissions: Permission[]): SessionUser {
  const user = requireUser();
  if (!canAccessApp(user.userType, APP)) {
    error(403, 'You do not have access to this application');
  }
  for (const permission of permissions) {
    if (!hasPermission(user.userType, permission)) {
      error(403, 'You do not have permission to perform this action');
    }
  }
  return user;
}

/** For `+layout.server.ts` / `+page.server.ts` — redirects rather than errors. */
export function requireAppAccess(locals: App.Locals): SessionUser {
  if (!locals.user) redirect(302, '/login');
  if (!canAccessApp(locals.user.userType, APP)) {
    redirect(302, '/login?error=unauthorized');
  }
  return locals.user as SessionUser;
}

/** Permission set to hand to the client for hiding/disabling actions. */
export function permissionsOf(user: { userType: string } | null | undefined) {
  return permissionsFor(user?.userType);
}
