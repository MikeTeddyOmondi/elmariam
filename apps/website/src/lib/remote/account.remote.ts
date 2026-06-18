import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { Customer, createCustomer as dbCreateCustomer } from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)),
    err: (e: any) => { throw new Error(e.message); },
  });
}

export const getMyProfile = query(async () => {
  const event = getRequestEvent();
  const email = event?.locals?.user?.email;
  if (!email) throw new Error('Unauthenticated');
  const customer = await Customer.findOne({ email }).lean();
  if (!customer) throw new Error('Customer profile not found');
  return JSON.parse(JSON.stringify(customer));
});

export const createCustomer = command(
  v.object({
    firstname:    v.pipe(v.string(), v.minLength(1)),
    lastname:     v.pipe(v.string(), v.minLength(1)),
    id_number:    v.string(),
    email:        v.pipe(v.string(), v.email()),
    phone_number: v.optional(v.string()),
  }),
  async (data) => unwrap(await dbCreateCustomer({
    ...data,
    phone_number: data.phone_number ? Number(data.phone_number) : undefined,
  }))
);
