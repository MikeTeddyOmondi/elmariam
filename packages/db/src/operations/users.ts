import { Result } from "better-result";
import { User } from "../models";
import {
  UserAlreadyExistsError,
  UserNotFoundError,
  UsersDatabaseError,
} from "../errors/users";
import type { UsersError } from "../errors/users";

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateUserInput {
  username: string;
  firstname?: string;
  lastname?: string;
  email: string;
  id_number: string;
  phone_number?: number;
  userType: "customer" | "receptionist" | "barista" | "waiter" | "management";
  openauth_subject_id?: string;
}

export interface UpdateUserInput extends Partial<Omit<CreateUserInput, "email" | "id_number">> {
  isActive?: boolean;
  isVerified?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dbErr(operation: string, e: unknown): UsersDatabaseError {
  return new UsersDatabaseError({
    operation,
    message: `${operation} failed: ${e instanceof Error ? e.message : String(e)}`,
    cause: e,
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listUsers() {
  return Result.tryPromise({
    try: () => User.find().sort({ createdAt: -1 }).lean(),
    catch: (e) => dbErr("listUsers", e),
  });
}

export async function getUser(id: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await User.findById(id).lean();
      if (!doc) throw new UserNotFoundError({ id, message: "User not found" });
      return doc;
    },
    catch: (e): UsersError => {
      if (e instanceof UserNotFoundError) return e;
      return dbErr("getUser", e);
    },
  });
}

export async function createUser(input: CreateUserInput) {
  return Result.tryPromise({
    try: () => User.create(input),
    catch: (e: any): UsersError => {
      if (e.code === 11000) {
        const field = Object.keys(e.keyPattern ?? {})[0] ?? "field";
        return new UserAlreadyExistsError({
          field,
          message: `A user with that ${field.replace(/_/g, " ")} already exists.`,
        });
      }
      return dbErr("createUser", e);
    },
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return Result.tryPromise({
    try: async () => {
      const doc = await User.findByIdAndUpdate(id, input, { new: true }).lean();
      if (!doc) throw new UserNotFoundError({ id, message: "User not found" });
      return doc;
    },
    catch: (e): UsersError => {
      if (e instanceof UserNotFoundError) return e;
      return dbErr("updateUser", e);
    },
  });
}
