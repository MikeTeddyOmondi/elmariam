import { error as httpError } from '@sveltejs/kit';
import { Customer } from '@elmariam/db';
import { requireUser } from './guard';

export type OwnCustomer = {
  id: string;
  id_number: string;
  email: string;
  firstname: string;
  lastname: string;
};

/**
 * Resolves the `Customer` record belonging to the signed-in session, or `null`.
 *
 * The session subject `id` is a `User` `_id` from the auth store, which is a
 * different collection from `Customer` — the two are linked by email. Every
 * customer-facing query must go through here so it can be scoped to a single
 * owner rather than reading the whole collection.
 *
 * A signed-in user legitimately may not have one: the issuer auto-provisions a
 * `User` on first login, and the `Customer` profile is only created when they
 * fill it in. Reads treat that as "nothing to show"; writes reject it.
 */
export async function findOwnCustomer(): Promise<OwnCustomer | null> {
  const user = requireUser();

  const customer = await Customer.findOne({ email: user.email }).lean<{
    _id: unknown;
    id_number: string;
    email: string;
    firstname: string;
    lastname: string;
  }>();

  if (!customer) return null;

  return {
    id: String(customer._id),
    id_number: customer.id_number,
    email: customer.email,
    firstname: customer.firstname,
    lastname: customer.lastname
  };
}

/** As {@link findOwnCustomer}, but 409s when no profile exists. For writes. */
export async function requireOwnCustomer(): Promise<OwnCustomer> {
  const customer = await findOwnCustomer();
  if (!customer) {
    throw httpError(409, 'Complete your profile before making a booking');
  }
  return customer;
}
