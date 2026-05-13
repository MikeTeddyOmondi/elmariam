import { query } from '$app/server';
import { getRequestEvent } from '$app/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8009';

async function apiFetch(path: string) {
  const event = getRequestEvent();
  const token = event.cookies.get('access_token');
  if (!token) throw new Error('Unauthenticated');
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.data?.message || 'API error');
  return data.data;
}

export const getDashboardStats = query(async () => {
  const [bookings, invoices, sales, orders] = await Promise.all([
    apiFetch('/api/hotel/bookings'),
    apiFetch('/api/hotel/invoices'),
    apiFetch('/api/bar/sales'),
    apiFetch('/api/restaurant/orders'),
  ]);
  return { bookings, invoices, sales, orders };
});
