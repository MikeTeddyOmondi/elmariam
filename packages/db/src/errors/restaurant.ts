import { TaggedError } from "better-result";

export class MenuItemNotFoundError extends TaggedError("MenuItemNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class OrderNotFoundError extends TaggedError("OrderNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class RestaurantDatabaseError extends TaggedError("RestaurantDatabaseError")<{
  operation: string;
  message: string;
  cause: unknown;
}>() {}

export type RestaurantError =
  | MenuItemNotFoundError
  | OrderNotFoundError
  | RestaurantDatabaseError;
