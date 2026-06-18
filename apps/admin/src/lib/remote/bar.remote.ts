import { query, command } from '$app/server';
import * as v from 'valibot';
import { listDrinks, listPurchases, listSales, createDrink as dbCreateDrink, createPurchase, createSale } from '@elmariam/db';

function unwrap<T>(result: { match: (h: { ok: (v: T) => T; err: (e: any) => never }) => T }) {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)),
    err: (e: any) => { throw new Error(e.message); },
  });
}

export const getDrinks       = query(async () => unwrap(await listDrinks()));
export const getBarPurchases = query(async () => unwrap(await listPurchases()));
export const getBarSales     = query(async () => unwrap(await listSales()));

export const createDrink = command(
  v.object({
    drinkName:         v.string(),
    drinkCode:         v.string(),
    typeOfDrink:       v.picklist(['spirit', 'beer', 'rtd', 'wine', 'water']),
    uom:               v.picklist(['bottles', 'crates', 'pack']),
    packageQty:        v.number(),
    buyingStockPrice:  v.number(),
    sellingStockPrice: v.number(),
  }),
  async (data) => unwrap(await dbCreateDrink(data))
);

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
