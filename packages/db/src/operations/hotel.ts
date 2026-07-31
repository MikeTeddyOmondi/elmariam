import { Result } from "better-result";
import { Customer, Booking, Invoice, Room, RoomType } from "../models";
import type { ICustomer, IBooking, IInvoice, IRoom, IRoomType } from "../models";
import {
  CustomerAlreadyExistsError,
  CustomerNotFoundError,
  RoomTypeNotFoundError,
  BookingNotFoundError,
  BookingConflictError,
  InvoiceNotFoundError,
  HotelDatabaseError,
} from "../errors/hotel";
import type { HotelError } from "../errors/hotel";

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateCustomerInput {
  firstname: string;
  lastname: string;
  id_number: string;
  email: string;
  phone_number?: number;
}

export interface CreateBookingInput {
  customerId: string;
  numberAdults: number;
  numberKids?: number;
  roomType: "single" | "double";
  checkInDate: string;
  checkOutDate: string;
  paymentMethod: "cash" | "mpesa" | "bank";
}

export interface CreateRoomTypeInput {
  title: string;
  description: string;
  rate: number;
  capacity: number;
  roomType: "single" | "double";
}

export interface CreateRoomInput {
  number: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function withId<T extends { _id: any }>(doc: T): T & { id: string } {
  return { ...doc, id: String(doc._id) };
}

function dbErr(operation: string, e: unknown): HotelDatabaseError {
  return new HotelDatabaseError({
    operation,
    message: `${operation} failed: ${e instanceof Error ? e.message : String(e)}`,
    cause: e,
  });
}

function getDatesInRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString());
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function listCustomers() {
  return Result.tryPromise({
    try: async () => (await Customer.find().sort({ createdAt: -1 }).lean<ICustomer[]>({ virtuals: true })).map(withId),
    catch: (e) => dbErr("listCustomers", e),
  });
}

export async function getCustomer(id: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await Customer.findById(id).lean<ICustomer>({ virtuals: true });
      if (!doc) throw new CustomerNotFoundError({ id, message: "Customer not found" });
      return withId(doc);
    },
    catch: (e): HotelError => {
      if (e instanceof CustomerNotFoundError) return e;
      return dbErr("getCustomer", e);
    },
  });
}

export async function searchCustomer(idNumber: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await Customer.findOne({ id_number: idNumber }).lean<ICustomer>({ virtuals: true });
      if (!doc) throw new CustomerNotFoundError({ id: idNumber, message: "Customer not found" });
      return withId(doc);
    },
    catch: (e): HotelError => {
      if (e instanceof CustomerNotFoundError) return e;
      return dbErr("searchCustomer", e);
    },
  });
}

export async function createCustomer(input: CreateCustomerInput) {
  return Result.tryPromise({
    try: () => Customer.create(input),
    catch: (e: any): HotelError => {
      if (e.code === 11000) {
        const field = Object.keys(e.keyPattern ?? {})[0] ?? "field";
        return new CustomerAlreadyExistsError({
          field,
          message: `A customer with that ${field.replace(/_/g, " ")} already exists.`,
        });
      }
      return dbErr("createCustomer", e);
    },
  });
}

// ── Bookings ──────────────────────────────────────────────────────────────────

/**
 * Restricts a listing to a single customer. Callers acting on behalf of a
 * customer (the public website) MUST pass this — without it every customer can
 * read every other customer's bookings and invoices.
 */
export interface OwnerScope {
  /** A `Customer` `_id`. */
  customerId?: string;
}

export async function listBookings(scope: OwnerScope = {}) {
  return Result.tryPromise({
    try: async () => {
      const filter = scope.customerId ? { customer: scope.customerId } : {};
      return (await Booking.find(filter)
        .populate("occupant")
        .populate("room-type")
        .populate("invoice")
        .lean<IBooking[]>({ virtuals: true })).map(withId);
    },
    catch: (e) => dbErr("listBookings", e),
  });
}

export async function getBooking(id: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await Booking.findById(id)
        .populate("occupant")
        .populate("room-type")
        .populate("invoice")
        .lean<IBooking>({ virtuals: true });
      if (!doc) throw new BookingNotFoundError({ id, message: "Booking not found" });
      return withId(doc);
    },
    catch: (e): HotelError => {
      if (e instanceof BookingNotFoundError) return e;
      return dbErr("getBooking", e);
    },
  });
}

export async function createBooking(input: CreateBookingInput) {
  return Result.gen(async function* () {
    // 1. Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(input.checkInDate);
    const checkOut = new Date(input.checkOutDate);

    if (checkIn < today) {
      return Result.err(
        new BookingConflictError({
          roomTypeId: input.roomType,
          message: "Check-in date cannot be in the past",
        })
      );
    }
    if (checkOut < checkIn) {
      return Result.err(
        new BookingConflictError({
          roomTypeId: input.roomType,
          message: "Check-out date must be on or after check-in date",
        })
      );
    }

    // 2. Find customer by ID number
    const customer = yield* Result.await(
      Result.tryPromise({
        try: async (): Promise<ICustomer> => {
          const doc = await Customer.findOne({ id_number: input.customerId });
          if (!doc) throw new CustomerNotFoundError({ id: input.customerId, message: "Customer not found" });
          return doc;
        },
        catch: (e): HotelError => {
          if (e instanceof CustomerNotFoundError) return e;
          return dbErr("createBooking.findCustomer", e);
        },
      })
    );

    // 3. Find room type
    const roomTypeDoc = yield* Result.await(
      Result.tryPromise({
        try: async (): Promise<IRoomType> => {
          const doc = await RoomType.findOne({ roomType: input.roomType });
          if (!doc) throw new RoomTypeNotFoundError({ id: input.roomType, message: "Room type not found" });
          return doc;
        },
        catch: (e): HotelError => {
          if (e instanceof RoomTypeNotFoundError) return e;
          return dbErr("createBooking.findRoomType", e);
        },
      })
    );

    // 4. Find available room for this type
    const availableRooms = yield* Result.await(
      Result.tryPromise({
        try: (): Promise<IRoom[]> => Room.find({ isBooked: false }),
        catch: (e) => dbErr("createBooking.findRooms", e),
      })
    );

    const typeRoomIds = roomTypeDoc.rooms.map((roomId) => roomId.toString());
    const matchingRooms = availableRooms.filter((r) =>
      typeRoomIds.includes(r._id.toString())
    );

    if (matchingRooms.length === 0) {
      return Result.err(
        new BookingConflictError({
          roomTypeId: roomTypeDoc._id.toString(),
          message: "No rooms available for the selected room type",
        })
      );
    }

    const selectedRoom = matchingRooms[Math.floor(Math.random() * matchingRooms.length)];

    // 5. Calculate invoice
    const diffinDays = Math.max(
      1,
      Math.ceil(Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    );
    const guests = Number(input.numberAdults) + Number(input.numberKids ?? 0);
    const subTotalCost = roomTypeDoc.rate * diffinDays * guests;
    const vat = 0.16 * subTotalCost;
    const totalCost = subTotalCost + vat;

    // 6. Create invoice
    const invoice = yield* Result.await(
      Result.tryPromise({
        try: (): Promise<IInvoice> =>
          new Invoice({
            status: "pending",
            paymentMethod: input.paymentMethod,
            vat,
            subTotalCost,
            totalCost,
          }).save(),
        catch: (e) => dbErr("createBooking.createInvoice", e),
      })
    );

    // 7. Create booking
    const booking = yield* Result.await(
      Result.tryPromise({
        try: (): Promise<IBooking> =>
          new Booking({
            customer: customer._id,
            numberAdults: input.numberAdults,
            numberKids: input.numberKids ?? 0,
            roomType: roomTypeDoc._id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            invoiceRef: invoice._id,
          }).save(),
        catch: (e) => dbErr("createBooking.createBooking", e),
      })
    );

    // 8. Back-reference booking in invoice + update room type + mark room booked
    yield* Result.await(
      Result.tryPromise({
        try: async () => {
          invoice.bookingRef = booking._id as any;
          await invoice.save();

          const datesInRange = getDatesInRange(checkIn, checkOut);
          roomTypeDoc.reservations.bookingRef.push(booking._id as any);
          datesInRange.forEach((d) => roomTypeDoc.reservations.unavailableDates.push(new Date(d)));
          await roomTypeDoc.save();

          selectedRoom.isBooked = true;
          await selectedRoom.save();
        },
        catch: (e) => dbErr("createBooking.finalise", e),
      })
    );

    return Result.ok({ booking, invoice, room: selectedRoom });
  });
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export async function listInvoices(scope: OwnerScope = {}) {
  return Result.tryPromise({
    try: async () => {
      let filter: Record<string, unknown> = {};

      if (scope.customerId) {
        // Invoices have no customer of their own — they hang off a booking.
        const bookingIds = await Booking.find({ customer: scope.customerId }).distinct("_id");
        filter = { bookingRef: { $in: bookingIds } };
      }

      return (await Invoice.find(filter).sort({ createdAt: -1 }).lean<IInvoice[]>({ virtuals: true })).map(withId);
    },
    catch: (e) => dbErr("listInvoices", e),
  });
}

export async function getInvoice(id: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await Invoice.findById(id).lean<IInvoice>({ virtuals: true });
      if (!doc) throw new InvoiceNotFoundError({ id, message: "Invoice not found" });
      return withId(doc);
    },
    catch: (e): HotelError => {
      if (e instanceof InvoiceNotFoundError) return e;
      return dbErr("getInvoice", e);
    },
  });
}

// ── Rooms & Room Types ────────────────────────────────────────────────────────

export async function listRooms() {
  return Result.tryPromise({
    try: async () => (await Room.find().sort({ createdAt: -1 }).lean({ virtuals: true })).map(withId),
    catch: (e) => dbErr("listRooms", e),
  });
}

export async function listRoomTypes() {
  return Result.tryPromise({
    try: async () => (await RoomType.find().lean<IRoomType[]>({ virtuals: true })).map(withId),
    catch: (e) => dbErr("listRoomTypes", e),
  });
}

export async function createRoomType(input: CreateRoomTypeInput) {
  return Result.tryPromise({
    try: () => RoomType.create(input),
    catch: (e: any): HotelError => {
      if (e.code === 11000) {
        return new RoomTypeNotFoundError({
          id: input.roomType,
          message: `Room type "${input.roomType}" already exists.`,
        });
      }
      return dbErr("createRoomType", e);
    },
  });
}

export async function createRoom(roomTypeId: string, input: CreateRoomInput) {
  return Result.gen(async function* () {
    const roomType = yield* Result.await(
      Result.tryPromise({
        try: async () => {
          const doc = await RoomType.findById(roomTypeId);
          if (!doc) throw new RoomTypeNotFoundError({ id: roomTypeId, message: "Room type not found" });
          return doc;
        },
        catch: (e): HotelError => {
          if (e instanceof RoomTypeNotFoundError) return e;
          return dbErr("createRoom.findRoomType", e);
        },
      })
    );

    const room = yield* Result.await(
      Result.tryPromise({
        try: () => Room.create({ number: input.number }),
        catch: (e: any): HotelError => {
          if (e.code === 11000) {
            return new HotelDatabaseError({
              operation: "createRoom.create",
              message: `Room number "${input.number}" already exists.`,
              cause: e,
            });
          }
          return dbErr("createRoom.create", e);
        },
      })
    );

    yield* Result.await(
      Result.tryPromise({
        try: async () => {
          roomType.rooms.push(room._id as any);
          await roomType.save();
        },
        catch: (e) => dbErr("createRoom.updateRoomType", e),
      })
    );

    return Result.ok(room);
  });
}
