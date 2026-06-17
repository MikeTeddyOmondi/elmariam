import { query, command } from '$app/server';
import * as v from 'valibot';
import {
  listBookings,
  getBooking,
  listInvoices,
  listRoomTypes,
  createBooking as dbCreateBooking,
} from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({ ok: (d) => d, err: (e: any) => { throw new Error(e.message); } });
}

export const getMyBookings = query(async () => unwrap(await listBookings()));
export const getMyInvoices = query(async () => unwrap(await listInvoices()));
export const getRoomTypes  = query(async () => unwrap(await listRoomTypes()));

export const getOneBooking = query(async (bookingId: string) =>
  unwrap(await getBooking(bookingId))
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
