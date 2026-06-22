import type { Result } from "better-result";
import { query, command } from "$app/server";
import { error as httpError } from "@sveltejs/kit";
import * as v from "valibot";
import {
  listUsers,
  createUser as dbCreateUser,
  updateUser as dbUpdateUser,
  deleteUser as dbDeleteUser,
} from "@elmariam/db";

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => {
      throw httpError(400, e.message);
    },
  });
}

export type UserView = {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  id_number: string;
  phone_number?: number;
  userType:
    | "admin"
    | "customer"
    | "receptionist"
    | "barista"
    | "waiter"
    | "management";
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const getUsers = query(
  async (): Promise<UserView[]> =>
    unwrap(await listUsers()) as unknown as UserView[],
);

export const createUser = command(
  v.object({
    username: v.string(),
    firstname: v.optional(v.string()),
    lastname: v.optional(v.string()),
    email: v.pipe(v.string(), v.email()),
    id_number: v.string(),
    phone_number: v.optional(v.string()),
    userType: v.picklist([
      "admin",
      "receptionist",
      "barista",
      "waiter",
      "management",
    ]),
  }),
  async ({ phone_number, ...data }) => {
    unwrap(
      await dbCreateUser({
        ...data,
        ...(phone_number ? { phone_number: Number(phone_number) } : {}),
      }),
    );
    getUsers().refresh();
  },
);

export const updateUser = command(
  v.object({
    id: v.string(),
    firstname: v.optional(v.string()),
    lastname: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    userType: v.optional(
      v.picklist(["admin", "receptionist", "barista", "waiter", "management"]),
    ),
    isActive: v.optional(v.boolean()),
  }),
  async ({ id, phone_number, ...rest }) =>
    unwrap(
      await dbUpdateUser(id, {
        ...rest,
        ...(phone_number ? { phone_number: Number(phone_number) } : {}),
      }),
    ),
);

export const deleteUser = command(
  v.object({ id: v.string() }),
  async ({ id }) => {
    unwrap(await dbDeleteUser(id));
  },
);
