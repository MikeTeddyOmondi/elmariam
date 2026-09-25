import { page } from '$app/stores';
import { get } from 'svelte/store';
import type { Permission } from '@elmariam/auth';

/**
 * Whether the signed-in role holds `permission`, per the set `+layout.server.ts`
 * puts on `page.data`.
 *
 * Cosmetic only. The remote functions guard themselves with `requirePermission`,
 * and each create route has a `+page.server.ts` doing the same, which is what
 * actually enforces access. This keeps `management` from being shown links to
 * pages it cannot use.
 *
 * Call it inside `$derived` so it re-evaluates when the session changes.
 */
export function can(permission: Permission): boolean {
  const permissions = get(page).data.permissions as readonly Permission[] | undefined;
  return permissions?.includes(permission) ?? false;
}
