import type { Result } from 'better-result';
import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import { listMenuItems, listOrders, createOrder as dbCreateOrder, updateOrderStatus as dbUpdateOrderStatus } from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

type OrderView = {
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

// Remote functions are their own HTTP endpoints and are NOT covered by
// `+layout.server.ts`, so every one of them guards itself.

export const getMenuItems = query(async () => {
  requirePermission('menu:read');
  return unwrap(await listMenuItems());
});

export const getOrders = query(async (): Promise<OrderView[]> => {
  requirePermission('orders:read');
  return unwrap(await listOrders()) as unknown as OrderView[];
});

export const createOrder = command(
  v.object({
    tableNumber:   v.optional(v.union([v.string(), v.number()])),
    items:         v.array(v.object({ menuItemId: v.string(), quantity: v.number() })),
    paymentMethod: v.optional(v.picklist(['cash', 'mpesa', 'bank'])),
  }),
  async ({ tableNumber, ...data }) => {
    requirePermission('orders:write');
    return unwrap(await dbCreateOrder({
      ...data,
      tableNumber: tableNumber !== undefined ? String(tableNumber) : undefined,
    }));
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
