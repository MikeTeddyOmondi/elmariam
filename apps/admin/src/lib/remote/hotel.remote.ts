import type { Result } from 'better-result';
import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import {
  listCustomers,
  getBooking,
  listBookings,
  createCustomer as dbCreateCustomer,
  createBooking as dbCreateBooking,
  listRooms,
  listRoomTypes,
  listInvoices,
  createRoom as dbCreateRoom,
  createRoomType as dbCreateRoomType,
} from '@elmariam/db';
import { RabbitMQConfig, rabbitMQEnvFromProcess } from '@elmariam/queue';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
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

export const getCustomers = query(async () => unwrap(await listCustomers()));
export const getBookings  = query(async (): Promise<BookingView[]> => unwrap(await listBookings()) as unknown as BookingView[]);
export const getRoomTypes = query(async () => unwrap(await listRoomTypes()));
export const getRooms     = query(async () => unwrap(await listRooms()));
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

export const createRoomType = command(
  v.object({
    title:       v.string(),
    description: v.string(),
    rate:        v.number(),
    capacity:    v.number(),
    roomType:    v.picklist(['single', 'double']),
  }),
  async (data) => unwrap(await dbCreateRoomType(data))
);

export const createRoom = command(
  v.object({ roomTypeId: v.string(), number: v.string() }),
  async ({ roomTypeId, number }) => unwrap(await dbCreateRoom(roomTypeId, { number }))
);

export const initiateMpesaPayment = command(
  v.object({ bookingId: v.string() }),
  async ({ bookingId }) => {
    const booking  = unwrap(await getBooking(bookingId));
    const customer = (booking as any).occupant ?? {};
    const invoice  = (booking as any).invoice  ?? {};
    const message  = {
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
    const queue    = new RabbitMQConfig(rabbitMQEnvFromProcess());
    await queue.connect();
    await queue.createQueue('sms');
    await queue.publishToQueue('sms', {
      message:      `Greetings ${customer.firstname}. Your hotel booking invoice of amount Kes. ${invoice.totalCost} is due on ${checkOut}`,
      phoneNumbers: '0' + phoneStr.slice(3),
    });
    await queue.close();
    return { message: 'SMS notification sent' };
  }
);
