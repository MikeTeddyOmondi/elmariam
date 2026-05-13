import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import * as v from 'valibot';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8009';

async function apiFetch(path: string, options: RequestInit = {}) {
  const event = getRequestEvent();
  const token = event.cookies.get('access_token');
  if (!token) throw new Error('Unauthenticated');
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.data?.message || 'API error');
  return data.data;
}

export const getMenuItems = query(() => apiFetch('/api/restaurant/menu'));
export const getOrders = query(() => apiFetch('/api/restaurant/orders'));

export const createMenuItem = command(
  v.object({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.picklist(['appetizer', 'main', 'dessert', 'beverage', 'side']),
    price: v.number(),
    isAvailable: v.optional(v.boolean()),
  }),
  async (data) => apiFetch('/api/restaurant/menu', { method: 'POST', body: JSON.stringify(data) })
);

export const updateOrderStatus = command(
  v.object({ orderId: v.string(), status: v.string() }),
  async ({ orderId, status }) =>
    apiFetch(`/api/restaurant/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
);
