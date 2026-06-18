import { query, command } from '$app/server';
import * as v from 'valibot';
import { listUsers, createUser as dbCreateUser, updateUser as dbUpdateUser, deleteUser as dbDeleteUser } from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)),
    err: (e: any) => { throw new Error(e.message); },
  });
}

export const getUsers = query(async () => unwrap(await listUsers()));

export const createUser = command(
  v.object({
    username:     v.string(),
    firstname:    v.optional(v.string()),
    lastname:     v.optional(v.string()),
    email:        v.pipe(v.string(), v.email()),
    id_number:    v.string(),
    phone_number: v.optional(v.string()),
    userType:     v.picklist(['admin', 'receptionist', 'barista', 'waiter', 'management']),
  }),
  async (data) => unwrap(await dbCreateUser({
    ...data,
    phone_number: data.phone_number ? Number(data.phone_number) : undefined,
  }))
);

export const updateUser = command(
  v.object({
    id:           v.string(),
    firstname:    v.optional(v.string()),
    lastname:     v.optional(v.string()),
    phone_number: v.optional(v.string()),
    userType:     v.optional(v.picklist(['admin', 'receptionist', 'barista', 'waiter', 'management'])),
    isActive:     v.optional(v.boolean()),
  }),
  async ({ id, phone_number, ...rest }) => unwrap(await dbUpdateUser(id, {
    ...rest,
    phone_number: phone_number ? Number(phone_number) : undefined,
  }))
);

export const deleteUser = command(
  v.object({ id: v.string() }),
  async ({ id }) => unwrap(await dbDeleteUser(id))
);
