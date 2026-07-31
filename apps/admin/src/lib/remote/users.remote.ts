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
import { ASSIGNABLE_STAFF_ROLES, type Role } from "@elmariam/auth";
import { requirePermission } from "$lib/server/guard";

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
  userType: Role;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Remote functions are their own HTTP endpoints and are NOT covered by
// `+layout.server.ts`. Without these guards any authenticated session — a
// customer included — could call `createUser`/`updateUser` and self-promote.

export const getUsers = query(async (): Promise<UserView[]> => {
  requirePermission("users:read");
  return unwrap(await listUsers()) as unknown as UserView[];
});

export const createUser = command(
  v.object({
    username: v.string(),
    firstname: v.optional(v.string()),
    lastname: v.optional(v.string()),
    email: v.pipe(v.string(), v.email()),
    id_number: v.string(),
    phone_number: v.optional(v.string()),
    userType: v.picklist(ASSIGNABLE_STAFF_ROLES),
  }),
  async ({ phone_number, ...data }) => {
    requirePermission("users:write");
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
    userType: v.optional(v.picklist(ASSIGNABLE_STAFF_ROLES)),
    isActive: v.optional(v.boolean()),
  }),
  async ({ id, phone_number, ...rest }) => {
    requirePermission("users:write");
    return unwrap(
      await dbUpdateUser(id, {
        ...rest,
        ...(phone_number ? { phone_number: Number(phone_number) } : {}),
      }),
    );
  },
);

export const deleteUser = command(
  v.object({ id: v.string() }),
  async ({ id }) => {
    const actor = requirePermission("users:delete");
    // Deleting yourself locks you out of the app you are using.
    if (actor.id === id) {
      throw httpError(400, "You cannot delete your own account");
    }
    unwrap(await dbDeleteUser(id));
  },
);
