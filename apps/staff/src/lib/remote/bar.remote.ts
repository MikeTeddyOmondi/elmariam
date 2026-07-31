import type { Result } from 'better-result';
import { query, form } from '$app/server';
import { error as httpError, invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import { listDrinks, listPurchases, listSales, createPurchase, createSale } from '@elmariam/db';
import { requirePermission } from '$lib/server/guard';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

/** Unwraps inside a `form()` handler — domain failures render on the form. */
function unwrapForm<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => invalid(e.message),
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

// No `createDrink` here on purpose: the drinks catalogue is maintained in the
// admin app. Baristas read it and move stock through purchases and sales.

export const createBarPurchase = form(
  v.object({
    receiptNumber: v.pipe(v.string(), v.minLength(1, 'Receipt number is required')),
    product:       v.pipe(v.string(), v.minLength(1, 'Select a product')),
    quantity:      v.pipe(v.number(), v.minValue(1, 'Must be at least 1')),
    supplier:      v.pipe(v.string(), v.minLength(1, 'Supplier is required')),
  }),
  async (data) => {
    requirePermission('bar_purchases:write');
    const created = unwrapForm(await createPurchase(data));
    await getBarPurchases().refresh();
    return created;
  }
);

/**
 * The cart is a dynamic list built in the browser rather than flat FormData
 * fields, so this one is submitted through `enhance` and has no no-JS fallback.
 */
export const checkoutBarSale = form(
  v.object({
    checkoutDrinkItems: v.array(v.object({ drinkId: v.string(), quantity: v.number() })),
  }),
  async (data) => {
    requirePermission('bar_sales:write');
    const created = unwrapForm(await createSale(data));
    await getBarSales().refresh();
    return created;
  }
);
