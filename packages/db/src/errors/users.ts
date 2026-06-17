import { TaggedError } from "better-result";

export class UserAlreadyExistsError extends TaggedError("UserAlreadyExistsError")<{
  field: string;
  message: string;
}>() {}

export class UserNotFoundError extends TaggedError("UserNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class UsersDatabaseError extends TaggedError("UsersDatabaseError")<{
  operation: string;
  message: string;
  cause: unknown;
}>() {}

export type UsersError =
  | UserAlreadyExistsError
  | UserNotFoundError
  | UsersDatabaseError;
