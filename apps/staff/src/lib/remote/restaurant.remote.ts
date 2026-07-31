import type { Result } from 'better-result';
import { query, command, form } from '$app/server';
import { error as httpError, invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import { listMenuItems, listOrders, createOrder as dbCreateOrder, updateOrderStatus as dbUpdateOrderStatus } from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

/** Unwraps inside a `form()` handler — domain failures render on the form. */
function unwrapForm<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => invalid(e.message),
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

/**
 * The order lines are a dynamic list built in the browser rather than flat
 * FormData fields, so this is submitted through `enhance` and has no no-JS
 * fallback.
 */
export const createOrder = form(
  v.object({
    tableNumber:   v.optional(v.union([v.string(), v.number()])),
    items:         v.pipe(
      v.array(v.object({ menuItemId: v.string(), quantity: v.number() })),
      v.minLength(1, 'Add at least one item')
    ),
    paymentMethod: v.optional(v.picklist(['cash', 'mpesa', 'bank'])),
  }),
  async ({ tableNumber, ...data }) => {
    requirePermission('orders:write');
    const created = unwrapForm(await dbCreateOrder({
      ...data,
      tableNumber: tableNumber !== undefined ? String(tableNumber) : undefined,
    }));
    await getOrders().refresh();
    return created;
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
