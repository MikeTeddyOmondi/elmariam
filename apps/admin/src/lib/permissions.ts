import { page } from '$app/stores';
import { get } from 'svelte/store';
import type { Permission } from '@elmariam/auth';

/**
 * Whether the signed-in role holds `permission`, per the set `+layout.server.ts`
 * puts on `page.data`.
 *
 * Cosmetic only. Every remote function guards itself with `requirePermission`,
 * which is what actually enforces access: a read-only role that calls a
 * mutation directly still gets a 403. This exists so `management` is not shown
 * create forms and delete buttons that could only ever fail.
 *
 * Call it inside `$derived` so it re-evaluates when the session changes.
 */
export function can(permission: Permission): boolean {
  const permissions = get(page).data.permissions as readonly Permission[] | undefined;
  return permissions?.includes(permission) ?? false;
}
