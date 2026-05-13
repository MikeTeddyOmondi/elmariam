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

export const getMyProfile = query(() => apiFetch('/api/hotel/customers/me'));

export const createCustomer = command(
  v.object({
    firstname: v.pipe(v.string(), v.minLength(1)),
    lastname: v.pipe(v.string(), v.minLength(1)),
    id_number: v.string(),
    email: v.pipe(v.string(), v.email()),
    phone_number: v.optional(v.string()),
  }),
  async (data) => apiFetch('/api/hotel/customers', { method: 'POST', body: JSON.stringify(data) })
);
