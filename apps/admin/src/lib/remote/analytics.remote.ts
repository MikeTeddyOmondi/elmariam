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
  const text = await res.text();
  if (!text) { if (!res.ok) throw new Error(`HTTP ${res.status}`); return null; }
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON response (${res.status})`); }
  if (!data.success) throw new Error(data.message || data.data?.message || 'API error');
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
