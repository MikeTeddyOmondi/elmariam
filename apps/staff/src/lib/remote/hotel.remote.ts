import { query, command } from '$app/server';
import * as v from 'valibot';
import {
  listCustomers,
  getCustomer,
  listBookings,
  getBooking,
  createCustomer as dbCreateCustomer,
  createBooking as dbCreateBooking,
  listRooms,
  listRoomTypes,
  listInvoices,
} from '@elmariam/db';
import { RabbitMQConfig, rabbitMQEnvFromProcess } from '@elmariam/queue';

function unwrap<T>(result: { match: (handlers: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({
    ok: (data) => data,
    err: (e: any) => { throw new Error(e.message); },
  });
}

export const getCustomers = query(async () => unwrap(await listCustomers()));
export const getBookings  = query(async () => unwrap(await listBookings()));
export const getRooms     = query(async () => unwrap(await listRooms()));
export const getRoomTypes = query(async () => unwrap(await listRoomTypes()));
export const getInvoices  = query(async () => unwrap(await listInvoices()));

export const getOneBooking = query(v.string(), async (bookingId: string) =>
  unwrap(await getBooking(bookingId))
);

export const createCustomer = command(
  v.object({
    firstname:    v.pipe(v.string(), v.minLength(1)),
    lastname:     v.pipe(v.string(), v.minLength(1)),
    id_number:    v.string(),
    email:        v.pipe(v.string(), v.email()),
    phone_number: v.optional(v.string()),
  }),
  async (data) => unwrap(await dbCreateCustomer({
    ...data,
    phone_number: data.phone_number ? Number(data.phone_number) : undefined,
  }))
);

export const createBooking = command(
  v.object({
    customerId:    v.string(),
    numberAdults:  v.pipe(v.number(), v.minValue(1)),
    numberKids:    v.pipe(v.number(), v.minValue(0)),
    roomType:      v.picklist(['single', 'double']),
    checkInDate:   v.string(),
    checkOutDate:  v.string(),
    paymentMethod: v.picklist(['cash', 'mpesa', 'bank']),
  }),
  async (data) => unwrap(await dbCreateBooking(data))
);

export const initiateMpesaPayment = command(
  v.object({ bookingId: v.string() }),
  async ({ bookingId }) => {
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
    const queue = new RabbitMQConfig(rabbitMQEnvFromProcess());
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
    const queue = new RabbitMQConfig(rabbitMQEnvFromProcess());
    await queue.connect();
    await queue.createQueue('sms');
    await queue.publishToQueue('sms', payload);
    await queue.close();
    return { message: 'SMS notification sent' };
  }
);
