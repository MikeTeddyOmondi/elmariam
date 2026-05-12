import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const STAFF_TYPES = ['receptionist', 'barista', 'waiter', 'management'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isLoginRoute = url.pathname.startsWith('/login');
  if (isLoginRoute) return {};

  if (!locals.user) throw redirect(302, '/login');
  if (!STAFF_TYPES.includes(locals.user.userType)) throw redirect(302, '/login?error=unauthorized');

  return { user: locals.user };
};
