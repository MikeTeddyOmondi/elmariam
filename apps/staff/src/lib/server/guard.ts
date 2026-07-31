import { error, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import {
  canAccessApp,
  canAccessStaffSection,
  hasPermission,
  permissionsFor,
  type AppId,
  type Permission,
  type Role,
  type StaffSection
} from '@elmariam/auth';

const APP: AppId = 'staff';

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

/**
 * Gate one of the `/receptionist`, `/barista`, `/waiter` areas. Without this a
 * waiter could open the barista and receptionist pages.
 */
export function requireStaffSection(locals: App.Locals, section: StaffSection): SessionUser {
  const user = requireAppAccess(locals);
  if (!canAccessStaffSection(user.userType, section)) {
    redirect(302, '/?error=unauthorized');
  }
  return user;
}

/** Permission set to hand to the client for hiding/disabling actions. */
export function permissionsOf(user: { userType: string } | null | undefined) {
  return permissionsFor(user?.userType);
}
