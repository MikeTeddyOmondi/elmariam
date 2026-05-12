import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  if (locals.user.userType !== 'customer') throw redirect(302, '/login?error=unauthorized');

  return { user: locals.user };
};
