import type { Result } from 'better-result';
import { query } from '$app/server';
import { listBookings, listInvoices, listSales, listOrders } from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  // `isErr()` rather than `result.match({ err })`: the throw below is a control
  // flow signal, and better-result treats a throw from inside a match handler
  // as a panic. It wraps it in "match err handler threw", which reaches the
  // client as an opaque 500 instead of the intended status and message.
  if (result.isErr()) throw new Error(result.error.message);
  return JSON.parse(JSON.stringify(result.value)) as T;
}

export const getDashboardStats = query(async () => {
  requirePermission('analytics:read');
  const [bookings, invoices, sales, orders] = await Promise.all([
    listBookings().then(unwrap),
    listInvoices().then(unwrap),
    listSales().then(unwrap),
    listOrders().then(unwrap),
  ]);
  return { bookings, invoices, sales, orders };
});
