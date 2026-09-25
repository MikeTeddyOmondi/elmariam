import type { Result } from 'better-result';
import { query, command, form } from '$app/server';
import { error as httpError, invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import { listMenuItems, listOrders, createOrder as dbCreateOrder, updateOrderStatus as dbUpdateOrderStatus } from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  // `isErr()` rather than `result.match({ err })`: `httpError` throws, and
  // better-result treats a throw from inside a match handler as a panic. It
  // wraps it in "match err handler threw", which reaches the client as an
  // opaque 500 instead of the intended status and message.
  if (result.isErr()) throw httpError(400, result.error.message);
  return JSON.parse(JSON.stringify(result.value)) as T;
}

/**
 * Unwraps inside a `form()` handler: domain failures render on the form.
 *
 * `isErr()` rather than `result.match({ err })`: `invalid()` throws to signal
 * a validation failure, and better-result treats a throw from inside a match
 * handler as a panic. It wraps it in "match err handler threw", so the
 * intended form error reached the client as an opaque 500 instead.
 */
function unwrapForm<T, E extends { message: string }>(result: Result<T, E>): T {
  if (result.isErr()) invalid(result.error.message);
  return JSON.parse(JSON.stringify(result.value)) as T;
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
