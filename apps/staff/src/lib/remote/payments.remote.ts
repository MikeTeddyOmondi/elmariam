import { command } from '$app/server';
import { invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import { publishMpesaStk, publishSms, toMsisdn, toLocalPhone } from '@elmariam/queue';
import { env } from '$env/dynamic/private';
import { requirePermission } from '$lib/server/guard';

// Generic charge / notify used by bar and restaurant sales, which (unlike
// bookings) have no stored customer, so the phone is captured at the till.

export const chargeMpesa = command(
  v.object({
    amount:    v.pipe(v.number(), v.minValue(1, 'Amount must be greater than zero')),
    phone:     v.pipe(v.string(), v.minLength(1, 'Enter a phone number')),
    reference: v.string(),
    name:      v.optional(v.string()),
  }),
  async ({ amount, phone, reference, name }) => {
    requirePermission('payments:initiate');
    if (!toMsisdn(phone)) invalid('Enter a valid Kenyan phone number.');
    const [firstName, ...rest] = (name ?? '').trim().split(/\s+/).filter(Boolean);
    await publishMpesaStk(env, {
      amount,
      phone,
      reference,
      firstName,
      lastName: rest.join(' ') || undefined,
    });
    return { message: 'Payment initiated' };
  }
);

export const sendSms = command(
  v.object({
    phone:   v.pipe(v.string(), v.minLength(1, 'Enter a phone number')),
    message: v.pipe(v.string(), v.minLength(1, 'Enter a message')),
  }),
  async ({ phone, message }) => {
    requirePermission('notifications:send');
    if (!toLocalPhone(phone)) invalid('Enter a valid Kenyan phone number.');
    await publishSms(env, { phone, message });
    return { message: 'SMS sent' };
  }
);
