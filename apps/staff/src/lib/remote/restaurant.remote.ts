import { query, command } from '$app/server';
import * as v from 'valibot';
import { listMenuItems, listOrders, createOrder as dbCreateOrder, updateOrderStatus as dbUpdateOrderStatus } from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)),
    err: (e: any) => { throw new Error(e.message); },
  });
}

export const getMenuItems = query(async () => unwrap(await listMenuItems()));
export const getOrders    = query(async () => unwrap(await listOrders()));

export const createOrder = command(
  v.object({
    tableNumber: v.optional(v.string()),
    items:       v.array(v.object({ menuItemId: v.string(), quantity: v.number() })),
  }),
  async (data) => unwrap(await dbCreateOrder(data))
);

export const updateOrderStatus = command(
  v.object({
    orderId: v.string(),
    status:  v.picklist(['pending', 'preparing', 'ready', 'served', 'cancelled']),
  }),
  async ({ orderId, status }) => unwrap(await dbUpdateOrderStatus(orderId, status))
);
