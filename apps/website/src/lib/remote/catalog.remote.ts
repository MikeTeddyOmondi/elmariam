import { query } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import type { Result } from 'better-result';
import { listRoomTypes, listMenuItems } from '@elmariam/db';
import type { IRoomType } from '@elmariam/db';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  // `isErr()` rather than `result.match({ err })`: `httpError` throws, and
  // better-result treats a throw from inside a match handler as a panic. It
  // wraps it in "match err handler threw", which reaches the client as an
  // opaque 500 instead of the intended status and message.
  if (result.isErr()) throw httpError(400, result.error.message);
  return JSON.parse(JSON.stringify(result.value)) as T;
}

/**
 * Public catalogue data for the marketing pages.
 *
 * Deliberately unguarded: room rates and the menu are public information, and
 * these pages are served to anonymous visitors.
 *
 * These replace `+page.server.ts` loads that fetched
 * `http://gateway:8009/api/public/*`. That gateway was removed in the rewrite
 * and the loads swallowed the failure in a `catch`, so the pages had been
 * silently rendering empty ("Menu coming soon") ever since.
 */
export const getRoomTypes = query(async (): Promise<IRoomType[]> =>
  unwrap(await listRoomTypes())
);

export type PublicMenuItem = {
  id: string;
  name: string;
  description?: string;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side';
  price: number;
  isAvailable: boolean;
};

export const getMenuItems = query(async (): Promise<PublicMenuItem[]> => {
  const items = unwrap(await listMenuItems()) as unknown as PublicMenuItem[];
  // Only show what is actually orderable.
  return items.filter((i) => i.isAvailable);
});
