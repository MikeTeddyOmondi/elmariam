import type { LayoutServerLoad } from './$types';
import { requireStaffSection } from '$lib/server/guard';

export const load: LayoutServerLoad = async ({ locals }) => {
  requireStaffSection(locals, 'receptionist');
  return {};
};
