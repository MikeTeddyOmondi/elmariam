import type { LayoutServerLoad } from './$types';
import { permissionsOf, requireAppAccess } from '$lib/server/guard';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isLoginRoute = url.pathname.startsWith('/login');
  if (isLoginRoute) return {};

  const user = requireAppAccess(locals);

  // `permissions` drives which action buttons the UI renders. The server-side
  // `requirePermission` guards remain authoritative — this is cosmetic only.
  return { user, permissions: permissionsOf(user) };
};
