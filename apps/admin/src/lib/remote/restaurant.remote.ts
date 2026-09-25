import type { Result } from 'better-result';
import { query, command, form } from '$app/server';
import { error as httpError, invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import {
  listMenuItems, listOrders,
  createMenuItem as dbCreateMenuItem,
  updateMenuItem as dbUpdateMenuItem,
  updateOrderStatus as dbUpdateOrderStatus,
  deleteMenuItem as dbDeleteMenuItem,
} from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

/** Unwraps inside a `form()` handler: domain failures render on the form. */
function unwrapForm<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => invalid(e.message),
  });
}

export type MenuItemView = {
  id: string;
  name: string;
  description?: string;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side';
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderView = {
  id: string;
  tableNumber?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  items: Array<{ menuItem: string; quantity: number; price: number }>;
  totalAmount: number;
  paymentMethod?: 'cash' | 'mpesa' | 'bank';
  paymentStatus: 'pending' | 'paid';
  createdAt: Date;
  updatedAt: Date;
};

export const getMenuItems = query(async (): Promise<MenuItemView[]> => {
  requirePermission('menu:read');
  return unwrap(await listMenuItems()) as unknown as MenuItemView[];
});

export const getOrders = query(async (): Promise<OrderView[]> => {
  requirePermission('orders:read');
  return unwrap(await listOrders()) as unknown as OrderView[];
});

export const createMenuItem = form(
  v.object({
    name:        v.pipe(v.string(), v.minLength(1, 'Name is required')),
    description: v.optional(v.string()),
    category:    v.picklist(['appetizer', 'main', 'dessert', 'beverage', 'side']),
    price:       v.pipe(v.number(), v.minValue(0, 'Price cannot be negative')),
    // `field.as('checkbox')` handles the on/absent FormData quirk.
    isAvailable: v.optional(v.boolean()),
  }),
  async (data) => {
    requirePermission('menu:write');
    const created = unwrapForm(await dbCreateMenuItem(data));
    await getMenuItems().refresh();
    return created;
  }
);

/** Use `updateMenuItem.for(item.id)` so each edit row gets its own instance. */
export const updateMenuItem = form(
  v.object({
    id:          v.string(),
    name:        v.pipe(v.string(), v.minLength(1, 'Name is required')),
    description: v.optional(v.string()),
    category:    v.picklist(['appetizer', 'main', 'dessert', 'beverage', 'side']),
    price:       v.pipe(v.number(), v.minValue(0, 'Price cannot be negative')),
    // Defaulted to false, not left optional: an unchecked box sends no
    // FormData entry at all, so `undefined` would be dropped from the update
    // and an item could never be marked unavailable.
    isAvailable: v.optional(v.boolean(), false),
  }),
  async ({ id, ...rest }) => {
    requirePermission('menu:write');
    const updated = unwrapForm(await dbUpdateMenuItem(id, rest));
    await getMenuItems().refresh();
    return updated;
  }
);

export const updateOrderStatus = command(
  v.object({
    orderId: v.string(),
    status:  v.picklist(['pending', 'preparing', 'ready', 'served', 'cancelled']),
  }),
  async ({ orderId, status }) => {
    requirePermission('orders:status');
    return unwrap(await dbUpdateOrderStatus(orderId, status));
  }
);

export const deleteMenuItem = form(v.object({ id: v.string() }), async ({ id }) => {
  requirePermission('menu:delete');
  unwrapForm(await dbDeleteMenuItem(id));
  await getMenuItems().refresh();
  return { deleted: id };
});
