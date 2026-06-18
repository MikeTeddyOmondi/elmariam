import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import type { Result } from 'better-result';
import {
  listBookings,
  getBooking,
  listInvoices,
  listRoomTypes,
  createBooking as dbCreateBooking,
} from '@elmariam/db';
import type { IBooking, IInvoice, IRoomType } from '@elmariam/db';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

export const getMyBookings = query(async (): Promise<IBooking[]>  => unwrap(await listBookings()));
export const getMyInvoices = query(async (): Promise<IInvoice[]>  => unwrap(await listInvoices()));
export const getRoomTypes  = query(async (): Promise<IRoomType[]> => unwrap(await listRoomTypes()));

export const getOneBooking = query(v.string(), async (bookingId: string): Promise<IBooking> =>
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
