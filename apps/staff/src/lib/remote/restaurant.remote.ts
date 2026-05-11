import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import * as v from 'valibot';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8009';

async function apiFetch(path: string, options: RequestInit = {}) {
  const event = getRequestEvent();
  const token = event.cookies.get('auth_token');
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

export const createOrder = command(
  v.object({
    tableNumber: v.optional(v.number()),
    items: v.array(v.object({ menuItemId: v.string(), quantity: v.number() })),
    paymentMethod: v.optional(v.picklist(['cash', 'mpesa', 'bank'])),
  }),
  async (data) => apiFetch('/api/restaurant/orders', { method: 'POST', body: JSON.stringify(data) })
);

export const updateOrderStatus = command(
  v.object({ orderId: v.string(), status: v.string() }),
  async ({ orderId, status }) =>
    apiFetch(`/api/restaurant/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
);
