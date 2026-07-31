import { query, form } from '$app/server';
import { error as httpError, invalid } from '@sveltejs/kit';
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
import { findOwnCustomer, requireOwnCustomer } from '$lib/server/customer';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

// Every query here is scoped to the signed-in customer. Holding `bookings:read`
// is not permission to read *everyone's* bookings — the owner filter is what
// actually enforces that.

// No profile yet means nothing can belong to them, so these return an empty
// list rather than erroring — the portal shows its normal empty state.

export const getMyBookings = query(async (): Promise<IBooking[]> => {
  requirePermission('bookings:read');
  const customer = await findOwnCustomer();
  if (!customer) return [];
  return unwrap(await listBookings({ customerId: customer.id }));
});

export const getMyInvoices = query(async (): Promise<IInvoice[]> => {
  requirePermission('invoices:read');
  const customer = await findOwnCustomer();
  if (!customer) return [];
  return unwrap(await listInvoices({ customerId: customer.id }));
});

// Room types are public catalogue data — no ownership to scope.
export const getRoomTypes = query(async (): Promise<IRoomType[]> => {
  return unwrap(await listRoomTypes());
});

export const getOneBooking = query(v.string(), async (bookingId: string): Promise<IBooking> => {
  requirePermission('bookings:read');
  const customer = await findOwnCustomer();

  // Do not 404 vs 403 differently — that would leak which ids exist.
  if (!customer) throw httpError(404, 'Booking not found');

  const booking = unwrap(await getBooking(bookingId));
  if (String((booking as any).customer) !== customer.id) {
    throw httpError(404, 'Booking not found');
  }

  return booking;
});

export const createBooking = form(
  v.object({
    // `customerId` is deliberately absent: it is taken from the session, never
    // from the client, so a customer cannot book on someone else's account.
    //
    // Declared as numbers, not coerced strings: `field.as('number')` on the
    // input is what parses the FormData value, and it only type-checks against
    // a numeric schema.
    numberAdults:  v.pipe(v.number(), v.minValue(1, 'At least one adult is required')),
    numberKids:    v.pipe(v.number(), v.minValue(0, 'Enter 0 or more')),
    roomType:      v.picklist(['single', 'double']),
    checkInDate:   v.pipe(v.string(), v.minLength(1, 'Pick a check-in date')),
    checkOutDate:  v.pipe(v.string(), v.minLength(1, 'Pick a check-out date')),
    paymentMethod: v.picklist(['cash', 'mpesa', 'bank']),
  }),
  async (data) => {
    requirePermission('bookings:write');
    const customer = await requireOwnCustomer();

    const result = await dbCreateBooking({ ...data, customerId: customer.id_number });
    // Domain failures (no rooms free, dates in the past) belong on the form,
    // not as an opaque 400.
    if (result.isErr()) invalid(result.error.message);

    await getMyBookings().refresh();
    await getMyInvoices().refresh();
    return { booked: true };
  }
);
