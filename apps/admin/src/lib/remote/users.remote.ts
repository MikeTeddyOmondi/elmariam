import type { Result } from "better-result";
import { query, command, form } from "$app/server";
import { error as httpError, invalid } from "@sveltejs/kit";
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

/**
 * Unwraps inside a `form()` handler.
 *
 * Domain failures become `invalid()` so they render against the form the user
 * is looking at, instead of the opaque 400 that `unwrap` throws.
 */
function unwrapForm<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => invalid(e.message),
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

/**
 * `form()` rather than `command()` so the page works without JavaScript and
 * field-level issues render inline. Every value arrives from `FormData` as a
 * string, hence the `v.pipe(v.string(), ...)` shapes below.
 */
export const createUser = form(
  v.object({
    username: v.pipe(v.string(), v.minLength(1, "Username is required")),
    firstname: v.optional(v.string()),
    lastname: v.optional(v.string()),
    email: v.pipe(v.string(), v.email("Enter a valid email address")),
    id_number: v.pipe(v.string(), v.minLength(1, "ID number is required")),
    phone_number: v.optional(v.string()),
    userType: v.picklist(ASSIGNABLE_STAFF_ROLES),
  }),
  async ({ phone_number, ...data }) => {
    requirePermission("users:write");

    unwrapForm(
      await dbCreateUser({
        ...data,
        ...(phone_number ? { phone_number: Number(phone_number) } : {}),
      }),
    );

    await getUsers().refresh();
    return { created: data.username };
  },
);

/** Use `updateUser.for(user.id)` so each row gets its own form instance. */
export const updateUser = form(
  v.object({
    id: v.string(),
    firstname: v.optional(v.string()),
    lastname: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    userType: v.optional(v.picklist(ASSIGNABLE_STAFF_ROLES)),
    // `field.as('checkbox')` handles the on/absent FormData quirk, so the
    // schema declares a plain boolean.
    isActive: v.optional(v.boolean()),
  }),
  async ({ id, phone_number, ...rest }) => {
    requirePermission("users:write");

    unwrapForm(
      await dbUpdateUser(id, {
        ...rest,
        ...(phone_number ? { phone_number: Number(phone_number) } : {}),
      }),
    );

    await getUsers().refresh();
    return { updated: id };
  },
);

/** Use `deleteUser.for(user.id)`. */
export const deleteUser = form(v.object({ id: v.string() }), async ({ id }) => {
  const actor = requirePermission("users:delete");

  // Deleting yourself locks you out of the app you are using.
  if (actor.id === id) invalid("You cannot delete your own account.");

  unwrapForm(await dbDeleteUser(id));

  await getUsers().refresh();
  return { deleted: id };
});
