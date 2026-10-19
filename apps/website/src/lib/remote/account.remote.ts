import { query, form } from '$app/server';
import { invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import {
  createCustomer as dbCreateCustomer,
  updateCustomer as dbUpdateCustomer,
} from '@elmariam/db';
import { requireUser } from '$lib/server/guard';
import { findOwnCustomerDoc, syncUserFromProfile } from '$lib/server/customer';

/**
 * Returns `null` when the signed-in user has not created a customer profile
 * yet. The issuer provisions a `User` on first login but the `Customer` record
 * only exists once they fill it in, so "no profile" is a normal state, not an
 * error.
 */
export const getMyProfile = query(async () => {
  const customer = await findOwnCustomerDoc();
  if (!customer) return null;
  return JSON.parse(JSON.stringify(customer));
});

/**
 * Kenyan mobile numbers in any common shape (0712..., 712..., 254712...,
 * +254712...), normalised to 2547XXXXXXXX / 2541XXXXXXXX: the form the
 * M-Pesa STK push and SMS helpers expect.
 */
function toMsisdn(raw: string): number | null {
  const digits = raw.replace(/[\s-]/g, '').replace(/^\+/, '');
  const m = digits.match(/^(?:254|0)?([17]\d{8})$/);
  return m ? Number(`254${m[1]}`) : null;
}

/**
 * Creates the signed-in user's customer profile, or updates it if one exists.
 *
 * `email` always comes from the session, never the request body: otherwise any
 * visitor could create customer records under an arbitrary address and then
 * read that person's bookings through the email link.
 *
 * `id_number` is set once, at creation. It is the customer's identity (bookings
 * reference it), so it is not editable here, matching `updateCustomer`.
 */
export const saveMyProfile = form(
  v.object({
    firstname:    v.pipe(v.string(), v.trim(), v.minLength(1, 'First name is required')),
    lastname:     v.pipe(v.string(), v.trim(), v.minLength(1, 'Last name is required')),
    id_number:    v.optional(v.pipe(v.string(), v.trim())),
    phone_number: v.pipe(v.string(), v.trim(), v.minLength(1, 'Phone number is required')),
  }),
  async ({ firstname, lastname, id_number, phone_number }, issue) => {
    const user = requireUser();

    const phone = toMsisdn(phone_number);
    if (!phone) invalid(issue.phone_number('Enter a Kenyan mobile number, e.g. 0712 345 678'));

    const existing = await findOwnCustomerDoc();

    if (existing) {
      const updated = await dbUpdateCustomer(String(existing._id), {
        firstname,
        lastname,
        phone_number: phone!,
      });
      if (updated.isErr()) invalid(updated.error.message);
      await syncUserFromProfile({ firstname, lastname, phone_number: phone!, id_number: existing.id_number });
    } else {
      if (!id_number || !/^[A-Za-z0-9]{5,20}$/.test(id_number)) {
        invalid(issue.id_number('Enter your national ID or passport number'));
      }
      const created = await dbCreateCustomer({
        firstname,
        lastname,
        id_number: id_number!,
        email: user.email,
        phone_number: phone!,
        user: user.id,
      });
      // Duplicate ID number lands here as "A customer with that id number
      // already exists.", which belongs on the form.
      if (created.isErr()) invalid(created.error.message);
      await syncUserFromProfile({ firstname, lastname, phone_number: phone!, id_number: id_number! });
    }

    await getMyProfile().refresh();
    return { saved: true };
  }
);
