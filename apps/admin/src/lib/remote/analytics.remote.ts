import { query } from '$app/server';
import { listBookings, listInvoices, listSales, listOrders } from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({ ok: (d) => d, err: (e: any) => { throw new Error(e.message); } });
}

export const getDashboardStats = query(async () => {
  const [bookings, invoices, sales, orders] = await Promise.all([
    listBookings().then(unwrap),
    listInvoices().then(unwrap),
    listSales().then(unwrap),
    listOrders().then(unwrap),
  ]);
  return { bookings, invoices, sales, orders };
});
