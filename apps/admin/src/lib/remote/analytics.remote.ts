import type { Result } from 'better-result';
import { query } from '$app/server';
import { listBookings, listInvoices, listSales, listOrders } from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw new Error(e.message); },
  });
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
