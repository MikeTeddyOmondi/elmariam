import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import type { Result } from 'better-result';
import { Customer, createCustomer as dbCreateCustomer } from '@elmariam/db';
import { requireUser } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  // `isErr()` rather than `result.match({ err })`: `httpError` throws, and
  // better-result treats a throw from inside a match handler as a panic. It
  // wraps it in "match err handler threw", which reaches the client as an
  // opaque 500 instead of the intended status and message.
  if (result.isErr()) throw httpError(400, result.error.message);
  return JSON.parse(JSON.stringify(result.value)) as T;
}

/**
 * Returns `null` when the signed-in user has not created a customer profile
 * yet. The issuer provisions a `User` on first login but the `Customer` record
 * only exists once they fill it in, so "no profile" is a normal state, not an
 * error.
 */
export const getMyProfile = query(async () => {
  const user = requireUser();
  const customer = await Customer.findOne({ email: user.email }).lean();
  if (!customer) return null;
  return JSON.parse(JSON.stringify(customer));
});

/**
 * Completes the signed-in user's own customer profile.
 *
 * `email` is taken from the session rather than the request body: otherwise
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
