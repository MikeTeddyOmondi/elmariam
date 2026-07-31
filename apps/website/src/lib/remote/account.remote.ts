import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import type { Result } from 'better-result';
import { Customer, createCustomer as dbCreateCustomer } from '@elmariam/db';
import { requireUser } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

export const getMyProfile = query(async () => {
  const user = requireUser();
  const customer = await Customer.findOne({ email: user.email }).lean();
  if (!customer) throw httpError(404, 'Customer profile not found');
  return JSON.parse(JSON.stringify(customer));
});

/**
 * Completes the signed-in user's own customer profile.
 *
 * `email` is taken from the session rather than the request body — otherwise
 * any visitor could create customer records under an arbitrary address and
 * subsequently read that person's bookings through the email link.
 */
export const createCustomer = command(
  v.object({
    firstname:    v.pipe(v.string(), v.minLength(1)),
    lastname:     v.pipe(v.string(), v.minLength(1)),
    id_number:    v.string(),
    phone_number: v.optional(v.string()),
  }),
  async (data) => {
    const user = requireUser();

    const existing = await Customer.findOne({ email: user.email }).lean();
    if (existing) throw httpError(409, 'A customer profile already exists for this account');

    const created = unwrap(await dbCreateCustomer({
      ...data,
      email: user.email,
      phone_number: data.phone_number ? Number(data.phone_number) : undefined,
    }));
    await getMyProfile().refresh();
    return created;
  }
);
