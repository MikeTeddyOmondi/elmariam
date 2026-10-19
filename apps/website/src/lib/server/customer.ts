import { error as httpError } from '@sveltejs/kit';
import { Customer, User } from '@elmariam/db';
import { requireUser } from './guard';

export type OwnCustomer = {
  id: string;
  id_number: string;
  email: string;
  firstname: string;
  lastname: string;
};

type CustomerDoc = {
  _id: unknown;
  id_number: string;
  email: string;
  firstname: string;
  lastname: string;
  phone_number?: number;
  user?: unknown;
};

/**
 * The signed-in user's `Customer` document, or `null`.
 *
 * The session subject `id` is a `User` `_id`; `Customer` is a separate
 * collection linked to it by `Customer.user`. Every customer-facing query goes
 * through here so it is scoped to a single owner rather than the collection.
 *
 * Lookup is by that link first. Failing that, a profile with the same email
 * and no link yet is claimed and linked: that is a walk-in customer created by
 * staff who has now signed up, or a profile saved before the link existed. One
 * already linked to a different user is never taken over.
 *
 * A signed-in user legitimately may not have one: the issuer provisions a
 * `User` on first login, and the `Customer` profile is only created when they
 * fill it in. Reads treat that as "nothing to show"; writes reject it.
 */
export async function findOwnCustomerDoc(): Promise<CustomerDoc | null> {
  const user = requireUser();

  const linked = await Customer.findOne({ user: user.id }).lean<CustomerDoc>();
  if (linked) return linked;

  const claimed = await Customer.findOneAndUpdate(
    { email: user.email, user: { $exists: false } },
    { $set: { user: user.id } },
    { new: true }
  ).lean<CustomerDoc>();
  return claimed ?? null;
}

export async function findOwnCustomer(): Promise<OwnCustomer | null> {
  const customer = await findOwnCustomerDoc();
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

/**
 * Copies the profile's details onto the signed-in `User`, so the account the
 * admin app lists matches the customer it belongs to.
 *
 * The issuer provisions users with empty names and a `pending-<uuid>` ID
 * number placeholder; the real ID number replaces only that placeholder, never
 * a value someone has already set. Best-effort: the profile is the record that
 * matters for bookings, so a failure here is logged rather than surfaced.
 */
export async function syncUserFromProfile(profile: {
  firstname: string;
  lastname: string;
  phone_number: number;
  id_number: string;
}) {
  const user = requireUser();
  try {
    await User.updateOne(
      { _id: user.id },
      {
        $set: {
          firstname: profile.firstname,
          lastname: profile.lastname,
          phone_number: profile.phone_number,
          updatedAt: new Date()
        }
      }
    );
    // Separate, because User.id_number is uniquely indexed: a clash (someone
    // else's account already holds this ID) must not undo the name update.
    await User.updateOne(
      { _id: user.id, id_number: /^pending-/ },
      { $set: { id_number: profile.id_number } }
    );
  } catch (e) {
    console.error('[profile] could not sync the user record:', e);
  }
}
