import type { Result } from 'better-result';
import { query, command, form } from '$app/server';
import { error as httpError, invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import {
  listCustomers,
  listBookings,
  getBooking,
  createCustomer as dbCreateCustomer,
  createBooking as dbCreateBooking,
  listRooms,
  listRoomTypes,
  listInvoices,
} from '@elmariam/db';
import { RabbitMQConfig, rabbitMQEnvFrom } from '@elmariam/queue';
import { env } from '$env/dynamic/private';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

/** Unwraps inside a `form()` handler — domain failures render on the form. */
function unwrapForm<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => invalid(e.message),
  });
}

type BookingView = {
  id: string;
  customer?: { firstname?: string; lastname?: string; email?: string; phone_number?: number };
  roomType?: { roomType?: string };
  numberAdults: number;
  numberKids: number;
  checkInDate: Date;
  checkOutDate: Date;
  invoiceRef?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Remote functions are their own HTTP endpoints and are NOT covered by
// `+layout.server.ts`, so every one of them guards itself.

export const getCustomers = query(async () => {
  requirePermission('customers:read');
  return unwrap(await listCustomers());
});

export const getBookings = query(async (): Promise<BookingView[]> => {
  requirePermission('bookings:read');
  return unwrap(await listBookings()) as unknown as BookingView[];
});

export const getRooms = query(async () => {
  requirePermission('rooms:read');
  return unwrap(await listRooms());
});

export const getRoomTypes = query(async () => {
  requirePermission('roomtypes:read');
  return unwrap(await listRoomTypes());
});

export const getInvoices = query(async () => {
  requirePermission('invoices:read');
  return unwrap(await listInvoices());
});

export const getOneBooking = query(v.string(), async (bookingId: string) => {
  requirePermission('bookings:read');
  return unwrap(await getBooking(bookingId));
});

// `form()` rather than `command()`: these submit without JavaScript and render
// field-level issues inline. Numeric fields stay numeric in the schema —
// `field.as('number')` on the input performs the FormData coercion.

export const createCustomer = form(
  v.object({
    firstname:    v.pipe(v.string(), v.minLength(1, 'First name is required')),
    lastname:     v.pipe(v.string(), v.minLength(1, 'Last name is required')),
    id_number:    v.pipe(v.string(), v.minLength(1, 'ID number is required')),
    email:        v.pipe(v.string(), v.email('Enter a valid email address')),
    phone_number: v.optional(v.string()),
  }),
  async (data) => {
    requirePermission('customers:write');
    const created = unwrapForm(await dbCreateCustomer({
      ...data,
      phone_number: data.phone_number ? Number(data.phone_number) : undefined,
    }));
    await getCustomers().refresh();
    return created;
  }
);

export const createBooking = form(
  v.object({
    customerId:    v.pipe(v.string(), v.minLength(1, 'Select a customer')),
    numberAdults:  v.pipe(v.number(), v.minValue(1, 'At least one adult is required')),
    numberKids:    v.pipe(v.number(), v.minValue(0, 'Enter 0 or more')),
    roomType:      v.picklist(['single', 'double']),
    checkInDate:   v.pipe(v.string(), v.minLength(1, 'Pick a check-in date')),
    checkOutDate:  v.pipe(v.string(), v.minLength(1, 'Pick a check-out date')),
    paymentMethod: v.picklist(['cash', 'mpesa', 'bank']),
  }),
  async (data) => {
    requirePermission('bookings:write');
    const created = unwrapForm(await dbCreateBooking(data));
    await getBookings().refresh();
    return created;
  }
);

export const initiateMpesaPayment = command(
  v.object({ bookingId: v.string() }),
  async ({ bookingId }) => {
    requirePermission('payments:initiate');
    const booking = unwrap(await getBooking(bookingId));
    const customer = (booking as any).occupant ?? {};
    const invoice  = (booking as any).invoice  ?? {};
    const message = {
      first_name:   customer.firstname,
      last_name:    customer.lastname,
      email:        customer.email,
      host:         'hotel-elmariam',
      amount:       invoice.totalCost,
      phone_number: customer.phone_number,
      api_ref:      `hotel-elmariam-booking-${bookingId}`,
    };
    const queue = new RabbitMQConfig(rabbitMQEnvFrom(env));
    await queue.connect();
    await queue.createQueue('mpesa');
    await queue.publishToQueue('mpesa', message);
    await queue.close();
    return { message: 'Payment initiated' };
  }
);

export const sendSmsNotification = command(
  v.object({ bookingId: v.string() }),
  async ({ bookingId }) => {
    requirePermission('notifications:send');
    const booking  = unwrap(await getBooking(bookingId));
    const customer = (booking as any).occupant ?? {};
    const invoice  = (booking as any).invoice  ?? {};
    const checkOut = new Date(booking.checkOutDate).toDateString();
    const phoneStr = String(customer.phone_number ?? '');
    const phoneNumbers = '0' + phoneStr.slice(3);
    const payload = {
      message:      `Greetings ${customer.firstname}. Your hotel booking invoice of amount Kes. ${invoice.totalCost} is due on ${checkOut}`,
      phoneNumbers,
    };
    const queue = new RabbitMQConfig(rabbitMQEnvFrom(env));
    await queue.connect();
    await queue.createQueue('sms');
    await queue.publishToQueue('sms', payload);
    await queue.close();
    return { message: 'SMS notification sent' };
  }
);
