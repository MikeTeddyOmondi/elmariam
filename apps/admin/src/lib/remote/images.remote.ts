import type { Result } from 'better-result';
import { command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import {
  updateDrink as dbUpdateDrink,
  updateMenuItem as dbUpdateMenuItem,
  updateRoomType as dbUpdateRoomType,
} from '@elmariam/db';
import type { Permission } from '@elmariam/auth';
import { requirePermission } from '$lib/server/guard';
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  deleteImage,
  keyFromPublicUrl,
  presignImageUpload as presign,
  publicUrl,
  verifyImage,
} from '$lib/server/storage';
import { getMenuItems } from './restaurant.remote';
import { getDrinks } from './bar.remote';
import { getRoomTypes } from './hotel.remote';

/**
 * Image uploads for room types, menu items and drinks.
 *
 * Two-phase, as in locci-platform: `presignImageUpload` hands the browser a
 * short-lived PUT URL for the public bucket, the browser uploads the bytes
 * straight to storage, then `attachImage` verifies the object and records its
 * public URL on the item. Each kind is gated by that item's write permission.
 */

const KINDS = {
  'room-type': {
    permission: 'roomtypes:write',
    prefix: 'room-types',
    save: (id: string, imageUrl: string) => dbUpdateRoomType(id, { imageUrl }),
    refresh: () => getRoomTypes().refresh(),
  },
  'menu-item': {
    permission: 'menu:write',
    prefix: 'menu-items',
    save: (id: string, imageUrl: string) => dbUpdateMenuItem(id, { imageUrl }),
    refresh: () => getMenuItems().refresh(),
  },
  drink: {
    permission: 'drinks:write',
    prefix: 'drinks',
    save: (id: string, imageUrl: string) => dbUpdateDrink(id, { imageUrl }),
    refresh: () => getDrinks().refresh(),
  },
} satisfies Record<
  string,
  {
    permission: Permission;
    prefix: string;
    save: (id: string, imageUrl: string) => Promise<Result<unknown, { message: string }>>;
    refresh: () => Promise<void>;
  }
>;

export type ImageKind = keyof typeof KINDS;

const kindSchema = v.picklist(Object.keys(KINDS) as ImageKind[]);
// Mongo ObjectIds only: the id becomes part of the object key.
const idSchema = v.pipe(v.string(), v.regex(/^[a-f0-9]{24}$/, 'Invalid id'));

export const presignImageUpload = command(
  v.object({
    kind: kindSchema,
    id: idSchema,
    contentType: v.picklist(Object.keys(IMAGE_TYPES), 'Use a JPEG, PNG, WebP or AVIF image.'),
    size: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'The file is empty.'),
      v.maxValue(MAX_IMAGE_BYTES, 'Images must be 5 MB or smaller.')
    ),
  }),
  async ({ kind, id, contentType, size }) => {
    const spec = KINDS[kind];
    requirePermission(spec.permission);
    // A fresh key per upload, so a replaced image never serves stale from a
    // cache that honoured the year-long max-age.
    const key = `${spec.prefix}/${id}/${crypto.randomUUID()}.${IMAGE_TYPES[contentType]}`;
    const uploadUrl = await presign(key, contentType, size);
    return { uploadUrl, key };
  }
);

export const attachImage = command(
  v.object({
    kind: kindSchema,
    id: idSchema,
    key: v.string(),
    previousUrl: v.optional(v.string()),
  }),
  async ({ kind, id, key, previousUrl }) => {
    const spec = KINDS[kind];
    requirePermission(spec.permission);

    // The key must be one presigned for this exact item, so one item's write
    // permission cannot attach an object uploaded for another.
    if (!key.startsWith(`${spec.prefix}/${id}/`) || key.includes('..')) {
      throw httpError(400, 'That upload does not belong to this item.');
    }
    if (!(await verifyImage(key))) {
      throw httpError(400, 'The upload did not complete or is not an allowed image.');
    }

    const imageUrl = publicUrl(key);
    const saved = await spec.save(id, imageUrl);
    if (saved.isErr()) throw httpError(400, saved.error.message);

    // Only delete what lives under this item's own prefix.
    const oldKey = keyFromPublicUrl(previousUrl);
    if (oldKey && oldKey !== key && oldKey.startsWith(`${spec.prefix}/${id}/`)) {
      await deleteImage(oldKey);
    }

    await spec.refresh();
    return { imageUrl };
  }
);
