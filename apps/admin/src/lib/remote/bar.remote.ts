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

export const getDrinks = query(() => apiFetch('/api/bar/drinks'));
export const getBarPurchases = query(() => apiFetch('/api/bar/purchases'));
export const getBarSales = query(() => apiFetch('/api/bar/sales'));

export const createBarPurchase = command(
  v.object({
    receiptNumber: v.string(),
    product: v.string(),
    quantity: v.number(),
    supplier: v.string(),
  }),
  async (data) => apiFetch('/api/bar/purchases', { method: 'POST', body: JSON.stringify(data) })
);

export const checkoutBarSale = command(
  v.object({
    checkoutDrinkItems: v.array(v.object({ drinkId: v.string(), quantity: v.number() })),
  }),
  async (data) => apiFetch('/api/bar/sales', { method: 'POST', body: JSON.stringify(data) })
);
