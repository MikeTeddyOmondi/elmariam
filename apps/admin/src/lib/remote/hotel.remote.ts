import type { Result } from 'better-result';
import { query, form } from '$app/server';
import { error as httpError, invalid } from '@sveltejs/kit';
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
  deleteCustomer as dbDeleteCustomer,
  deleteRoom as dbDeleteRoom,
  deleteRoomType as dbDeleteRoomType,
} from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

/**
 * Unwraps inside a `form()` handler. Domain failures become `invalid()` so they
 * render against the form rather than as an opaque 400.
 */
function unwrapForm<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => invalid(e.message),
  });
}

export type CustomerView = {
  id: string;
  firstname: string;
  lastname: string;
  id_number: string;
  email: string;
  phone_number?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomView = {
  id: string;
  number: string;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomTypeView = {
  id: string;
  title: string;
  description: string;
  rate: number;
  capacity: number;
  roomType: 'single' | 'double';
  createdAt: Date;
  updatedAt: Date;
};

export type BookingView = {
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

export const getCustomers = query(async (): Promise<CustomerView[]> => {
  requirePermission('customers:read');
  return unwrap(await listCustomers()) as unknown as CustomerView[];
});

export const getBookings = query(async (): Promise<BookingView[]> => {
  requirePermission('bookings:read');
  return unwrap(await listBookings()) as unknown as BookingView[];
});

export const getRoomTypes = query(async (): Promise<RoomTypeView[]> => {
  requirePermission('roomtypes:read');
  return unwrap(await listRoomTypes()) as unknown as RoomTypeView[];
});

export const getRooms = query(async (): Promise<RoomView[]> => {
  requirePermission('rooms:read');
  return unwrap(await listRooms()) as unknown as RoomView[];
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
// field-level issues inline. Numeric fields stay numeric in the schema.
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

export const createRoomType = form(
  v.object({
    title:       v.pipe(v.string(), v.minLength(1, 'Title is required')),
    description: v.pipe(v.string(), v.minLength(1, 'Description is required')),
    rate:        v.pipe(v.number(), v.minValue(0, 'Rate cannot be negative')),
    capacity:    v.pipe(v.number(), v.minValue(1, 'Capacity must be at least 1')),
    roomType:    v.picklist(['single', 'double']),
  }),
  async (data) => {
    requirePermission('roomtypes:write');
    const created = unwrapForm(await dbCreateRoomType(data));
    await getRoomTypes().refresh();
    return created;
  }
);

export const createRoom = form(
  v.object({
    roomTypeId: v.pipe(v.string(), v.minLength(1, 'Select a room type')),
    number:     v.pipe(v.string(), v.minLength(1, 'Room number is required')),
  }),
  async ({ roomTypeId, number }) => {
    requirePermission('rooms:write');
    const created = unwrapForm(await dbCreateRoom(roomTypeId, { number }));
    await getRooms().refresh();
    return created;
  }
);

// Deletes. Each refuses when a dependant record would be orphaned; the db layer
// returns that as a domain error, which `invalid()` renders on the form.

export const deleteCustomer = form(v.object({ id: v.string() }), async ({ id }) => {
  requirePermission('customers:delete');
  unwrapForm(await dbDeleteCustomer(id));
  await getCustomers().refresh();
  return { deleted: id };
});

export const deleteRoom = form(v.object({ id: v.string() }), async ({ id }) => {
  requirePermission('rooms:delete');
  unwrapForm(await dbDeleteRoom(id));
  await getRooms().refresh();
  return { deleted: id };
});

export const deleteRoomType = form(v.object({ id: v.string() }), async ({ id }) => {
  requirePermission('roomtypes:delete');
  unwrapForm(await dbDeleteRoomType(id));
  await getRoomTypes().refresh();
  return { deleted: id };
});
