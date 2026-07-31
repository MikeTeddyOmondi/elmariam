import type { LayoutServerLoad } from './$types';
import { permissionsOf, requireAppAccess } from '$lib/server/guard';

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = requireAppAccess(locals);

  return { user, permissions: permissionsOf(user) };
};
