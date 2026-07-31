import type { Result } from 'better-result';
import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import { listDrinks, listPurchases, listSales, createPurchase, createSale, createDrink as dbCreateDrink } from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

type BarPurchaseView = {
  id: string;
  receiptNumber: string;
  product?: { drinkName?: string };
  quantity: number;
  stockValue: number;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
};

// Remote functions are their own HTTP endpoints and are NOT covered by
// `+layout.server.ts`, so every one of them guards itself.

export const getDrinks = query(async () => {
  requirePermission('drinks:read');
  return unwrap(await listDrinks());
});

export const getBarPurchases = query(async (): Promise<BarPurchaseView[]> => {
  requirePermission('bar_purchases:read');
  return unwrap(await listPurchases()) as unknown as BarPurchaseView[];
});

export const getBarSales = query(async () => {
  requirePermission('bar_sales:read');
  return unwrap(await listSales());
});

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
  async (data) => {
    requirePermission('drinks:write');
    const created = unwrap(await dbCreateDrink(data));
    await getDrinks().refresh();
    return created;
  }
);

export const createBarPurchase = command(
  v.object({
    receiptNumber: v.string(),
    product:       v.string(),
    quantity:      v.number(),
    supplier:      v.string(),
  }),
  async (data) => {
    requirePermission('bar_purchases:write');
    return unwrap(await createPurchase(data));
  }
);

export const checkoutBarSale = command(
  v.object({
    checkoutDrinkItems: v.array(v.object({ drinkId: v.string(), quantity: v.number() })),
  }),
  async (data) => {
    requirePermission('bar_sales:write');
    return unwrap(await createSale(data));
  }
);
