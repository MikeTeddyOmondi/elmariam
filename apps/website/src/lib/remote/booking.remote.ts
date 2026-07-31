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
import { requirePermission } from '$lib/server/guard';
import { requireOwnCustomer } from '$lib/server/customer';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

// Every query here is scoped to the signed-in customer. Holding `bookings:read`
// is not permission to read *everyone's* bookings — the owner filter is what
// actually enforces that.

export const getMyBookings = query(async (): Promise<IBooking[]> => {
  requirePermission('bookings:read');
  const customer = await requireOwnCustomer();
  return unwrap(await listBookings({ customerId: customer.id }));
});

export const getMyInvoices = query(async (): Promise<IInvoice[]> => {
  requirePermission('invoices:read');
  const customer = await requireOwnCustomer();
  return unwrap(await listInvoices({ customerId: customer.id }));
});

// Room types are public catalogue data — no ownership to scope.
export const getRoomTypes = query(async (): Promise<IRoomType[]> => {
  return unwrap(await listRoomTypes());
});

export const getOneBooking = query(v.string(), async (bookingId: string): Promise<IBooking> => {
  requirePermission('bookings:read');
  const customer = await requireOwnCustomer();
  const booking = unwrap(await getBooking(bookingId));

  // Do not 404 vs 403 differently — that would leak which ids exist.
  if (String((booking as any).customer) !== customer.id) {
    throw httpError(404, 'Booking not found');
  }

  return booking;
});

export const createBooking = command(
  v.object({
    // `customerId` is deliberately absent: it is taken from the session, never
    // from the client, so a customer cannot book on someone else's account.
    numberAdults:  v.pipe(v.number(), v.minValue(1)),
    numberKids:    v.pipe(v.number(), v.minValue(0)),
    roomType:      v.picklist(['single', 'double']),
    checkInDate:   v.string(),
    checkOutDate:  v.string(),
    paymentMethod: v.picklist(['cash', 'mpesa', 'bank']),
  }),
  async (data) => {
    requirePermission('bookings:write');
    const customer = await requireOwnCustomer();
    const created = unwrap(await dbCreateBooking({ ...data, customerId: customer.id_number }));
    await getMyBookings().refresh();
    await getMyInvoices().refresh();
    return created;
  }
);
