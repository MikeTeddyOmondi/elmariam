import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import * as v from 'valibot';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8009';

async function getToken() {
  const event = getRequestEvent();
  const token = event.cookies.get('access_token');
  if (!token) throw new Error('Unauthenticated');
  return token;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
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

export const getCustomers = query(() => apiFetch('/api/hotel/customers'));
export const getBookings = query(() => apiFetch('/api/hotel/bookings'));
export const getRoomTypes = query(() => apiFetch('/api/hotel/roomtypes'));
export const getRooms = query(() => apiFetch('/api/hotel/rooms'));
export const getInvoices = query(() => apiFetch('/api/hotel/invoices'));

export const getOneBooking = query(async (bookingId: string) =>
  apiFetch(`/api/hotel/bookings/${bookingId}`)
);

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

export const createRoomType = command(
  v.object({
    title: v.string(),
    description: v.string(),
    rate: v.number(),
    capacity: v.number(),
    roomType: v.picklist(['single', 'double']),
  }),
  async (data) => apiFetch('/api/hotel/roomtypes', { method: 'POST', body: JSON.stringify(data) })
);

export const initiateMpesaPayment = command(
  v.object({ bookingId: v.string() }),
  async ({ bookingId }) => apiFetch(`/api/hotel/mpesa-payment/${bookingId}`, { method: 'POST' })
);

export const sendSmsNotification = command(
  v.object({ bookingId: v.string() }),
  async ({ bookingId }) => apiFetch(`/api/hotel/sms/${bookingId}`, { method: 'POST' })
);
