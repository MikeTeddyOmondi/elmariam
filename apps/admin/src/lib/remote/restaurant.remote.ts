import { query, command } from '$app/server';
import * as v from 'valibot';
import { listMenuItems, listOrders, createMenuItem, updateOrderStatus } from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({ ok: (d) => d, err: (e: any) => { throw new Error(e.message); } });
}

export const getMenuItems = query(async () => unwrap(await listMenuItems()));
export const getOrders    = query(async () => unwrap(await listOrders()));

export const createMenuItemCmd = command(
  v.object({
    name:        v.string(),
    description: v.optional(v.string()),
    category:    v.picklist(['appetizer', 'main', 'dessert', 'beverage', 'side']),
    price:       v.number(),
    isAvailable: v.optional(v.boolean()),
  }),
  async (data) => unwrap(await createMenuItem(data))
);

export const updateOrderStatusCmd = command(
  v.object({
    orderId: v.string(),
    status:  v.picklist(['pending', 'preparing', 'ready', 'served', 'cancelled']),
  }),
  async ({ orderId, status }) => unwrap(await updateOrderStatus(orderId, status))
);
