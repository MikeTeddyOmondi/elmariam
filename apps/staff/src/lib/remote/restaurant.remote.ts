import type { Result } from 'better-result';
import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import { listMenuItems, listOrders, createOrder as dbCreateOrder, updateOrderStatus as dbUpdateOrderStatus } from '@elmariam/db';

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

export const getMenuItems = query(async () => unwrap(await listMenuItems()));
export const getOrders    = query(async (): Promise<OrderView[]> => unwrap(await listOrders()) as unknown as OrderView[]);

export const createOrder = command(
  v.object({
    tableNumber:   v.optional(v.union([v.string(), v.number()])),
    items:         v.array(v.object({ menuItemId: v.string(), quantity: v.number() })),
    paymentMethod: v.optional(v.picklist(['cash', 'mpesa', 'bank'])),
  }),
  async ({ tableNumber, ...data }) => unwrap(await dbCreateOrder({
    ...data,
    tableNumber: tableNumber !== undefined ? String(tableNumber) : undefined,
  }))
);

export const updateOrderStatus = command(
  v.object({
    orderId: v.string(),
    status:  v.picklist(['pending', 'preparing', 'ready', 'served', 'cancelled']),
  }),
  async ({ orderId, status }) => unwrap(await dbUpdateOrderStatus(orderId, status))
);
