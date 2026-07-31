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
 * Resolves the `Customer` record belonging to the signed-in session.
 *
 * The session subject `id` is a `User` `_id` from the auth store, which is a
 * different collection from `Customer` — the two are linked by email. Every
 * customer-facing query must go through here so it can be scoped to a single
 * owner rather than reading the whole collection.
 */
export async function requireOwnCustomer(): Promise<OwnCustomer> {
  const user = requireUser();

  const customer = await Customer.findOne({ email: user.email }).lean<{
    _id: unknown;
    id_number: string;
    email: string;
    firstname: string;
    lastname: string;
  }>();

  if (!customer) {
    throw httpError(404, 'No customer profile is linked to this account');
  }

  return {
    id: String(customer._id),
    id_number: customer.id_number,
    email: customer.email,
    firstname: customer.firstname,
    lastname: customer.lastname
  };
}
