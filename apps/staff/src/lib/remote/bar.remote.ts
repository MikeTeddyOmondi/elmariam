import { query, command } from '$app/server';
import * as v from 'valibot';
import { listDrinks, listPurchases, listSales, createPurchase, createSale } from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)),
    err: (e: any) => { throw new Error(e.message); },
  });
}

export const getDrinks       = query(async () => unwrap(await listDrinks()));
export const getBarPurchases = query(async () => unwrap(await listPurchases()));
export const getBarSales     = query(async () => unwrap(await listSales()));

export const createBarPurchase = command(
  v.object({
    receiptNumber: v.string(),
    product:       v.string(),
    quantity:      v.number(),
    supplier:      v.string(),
  }),
  async (data) => unwrap(await createPurchase(data))
);

export const checkoutBarSale = command(
  v.object({
    checkoutDrinkItems: v.array(v.object({ drinkId: v.string(), quantity: v.number() })),
  }),
  async (data) => unwrap(await createSale(data))
);
