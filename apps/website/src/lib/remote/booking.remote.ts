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

export const getMyBookings = query(() => apiFetch('/api/hotel/bookings'));
export const getMyInvoices = query(() => apiFetch('/api/hotel/invoices'));
export const getOneBooking = query(async (bookingId: string) => apiFetch(`/api/hotel/bookings/${bookingId}`));
export const getRoomTypes = query(() => apiFetch('/api/hotel/roomtypes'));

export const createBooking = command(
  v.object({
    customerId: v.string(),
    numberAdults: v.pipe(v.number(), v.minValue(1)),
    numberKids: v.pipe(v.number(), v.minValue(0)),
    roomType: v.picklist(['single', 'double']),
    checkInDate: v.string(),
    checkOutDate: v.string(),
    paymentMethod: v.picklist(['cash', 'mpesa', 'bank']),
  }),
  async (data) => apiFetch('/api/hotel/bookings', { method: 'POST', body: JSON.stringify(data) })
);
