import { TaggedError } from "better-result";

export class CustomerAlreadyExistsError extends TaggedError("CustomerAlreadyExistsError")<{
  field: string;
  message: string;
}>() {}

export class CustomerNotFoundError extends TaggedError("CustomerNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class RoomTypeNotFoundError extends TaggedError("RoomTypeNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class RoomNotFoundError extends TaggedError("RoomNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class BookingConflictError extends TaggedError("BookingConflictError")<{
  roomTypeId: string;
  message: string;
}>() {}

export class BookingNotFoundError extends TaggedError("BookingNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class InvoiceNotFoundError extends TaggedError("InvoiceNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class HotelDatabaseError extends TaggedError("HotelDatabaseError")<{
  operation: string;
  message: string;
  cause: unknown;
}>() {}

export type HotelError =
  | CustomerAlreadyExistsError
  | CustomerNotFoundError
  | RoomTypeNotFoundError
  | RoomNotFoundError
  | BookingNotFoundError
  | BookingConflictError
  | InvoiceNotFoundError
  | HotelDatabaseError;
