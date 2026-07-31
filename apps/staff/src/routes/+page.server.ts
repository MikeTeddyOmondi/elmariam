import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { canAccessStaffSection, type StaffSection } from '@elmariam/auth';
import { requireAppAccess } from '$lib/server/guard';

// Order matters: the first section the role can open becomes their landing
// page. `admin` and `management` can open all three, so they land on
// receptionist.
const SECTIONS: StaffSection[] = ['receptionist', 'barista', 'waiter'];

export const load: PageServerLoad = async ({ locals }) => {
  const user = requireAppAccess(locals);

  const section = SECTIONS.find((s) => canAccessStaffSection(user.userType, s));
  if (!section) redirect(302, '/login?error=unauthorized');

  redirect(302, `/${section}`);
};
