import { query } from '$app/server';
import { getRequestEvent } from '$app/server';

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
  const text = await res.text();
  if (!text) { if (!res.ok) throw new Error(`HTTP ${res.status}`); return null; }
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON response (${res.status})`); }
  if (!data.success) throw new Error(data.message || data.data?.message || 'API error');
  return data.data;
}

// Users are accessed via hotel customers endpoint
export const getUsers = query(() => apiFetch('/api/hotel/customers'));
