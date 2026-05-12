import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isLoginRoute = url.pathname.startsWith('/login');
  if (isLoginRoute) return {};

  if (!locals.user) throw redirect(302, '/login');
  if (locals.user.userType !== 'management') throw redirect(302, '/login?error=unauthorized');

  return { user: locals.user };
};
