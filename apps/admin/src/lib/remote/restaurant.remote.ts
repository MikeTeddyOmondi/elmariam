import { query, command } from '$app/server';
import * as v from 'valibot';
import {
  listMenuItems, listOrders,
  createMenuItem as dbCreateMenuItem,
  updateMenuItem as dbUpdateMenuItem,
  updateOrderStatus as dbUpdateOrderStatus,
} from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)),
    err: (e: any) => { throw new Error(e.message); },
  });
}

export const getMenuItems = query(async () => unwrap(await listMenuItems()));
export const getOrders    = query(async () => unwrap(await listOrders()));

export const createMenuItem = command(
  v.object({
    name:        v.string(),
    description: v.optional(v.string()),
    category:    v.picklist(['appetizer', 'main', 'dessert', 'beverage', 'side']),
    price:       v.number(),
    isAvailable: v.optional(v.boolean()),
  }),
  async (data) => unwrap(await dbCreateMenuItem(data))
);

export const updateMenuItem = command(
  v.object({
    id:          v.string(),
    name:        v.optional(v.string()),
    description: v.optional(v.string()),
    category:    v.optional(v.picklist(['appetizer', 'main', 'dessert', 'beverage', 'side'])),
    price:       v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
  }),
  async ({ id, ...rest }) => unwrap(await dbUpdateMenuItem(id, rest))
);

export const updateOrderStatus = command(
  v.object({
    orderId: v.string(),
    status:  v.picklist(['pending', 'preparing', 'ready', 'served', 'cancelled']),
  }),
  async ({ orderId, status }) => unwrap(await dbUpdateOrderStatus(orderId, status))
);
