import { TaggedError } from "better-result";

export class DrinkAlreadyExistsError extends TaggedError("DrinkAlreadyExistsError")<{
  field: string;
  message: string;
}>() {}

export class DrinkNotFoundError extends TaggedError("DrinkNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class InsufficientStockError extends TaggedError("InsufficientStockError")<{
  drinkId: string;
  requested: number;
  available: number;
  message: string;
}>() {}

export class BarDatabaseError extends TaggedError("BarDatabaseError")<{
  operation: string;
  message: string;
  cause: unknown;
}>() {}

export type BarError =
  | DrinkAlreadyExistsError
  | DrinkNotFoundError
  | InsufficientStockError
  | BarDatabaseError;
