import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/guard';

/**
 * This page exists only to create a record, so the route itself is guarded.
 *
 * `management` may open every staff section but holds no write permissions, so
 * without this it reached a form whose submit could only ever 403. The remote
 * function guards itself too: this just fails at the door instead.
 */
export const load: PageServerLoad = async () => {
  requirePermission('bar_purchases:write');
  return {};
};
