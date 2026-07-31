import type { Result } from 'better-result';
import { query, form } from '$app/server';
import { error as httpError, invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import { listDrinks, listPurchases, listSales, createDrink as dbCreateDrink, createPurchase, createSale } from '@elmariam/db';
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

export type DrinkView = {
  id: string;
  drinkName: string;
  drinkCode: string;
  typeOfDrink: 'spirit' | 'beer' | 'rtd' | 'wine' | 'water';
  uom: 'bottles' | 'crates' | 'pack';
  packageQty: number;
  buyingPrice: number;
  sellingPrice: number;
  buyingStockPrice: number;
  sellingStockPrice: number;
  stockQty: number;
  inStock: boolean;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BarPurchaseView = {
  id: string;
  receiptNumber: string;
  product?: { drinkName?: string };
  quantity: number;
  stockValue: number;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BarSaleView = {
  id: string;
  drinks: Array<{ productID: string; qtyBought: number; stockValue: number }>;
  totalStockValue: number;
  createdAt: Date;
  updatedAt: Date;
};

export const getDrinks = query(async (): Promise<DrinkView[]> => {
  requirePermission('drinks:read');
  return unwrap(await listDrinks()) as unknown as DrinkView[];
});

export const getBarPurchases = query(async (): Promise<BarPurchaseView[]> => {
  requirePermission('bar_purchases:read');
  return unwrap(await listPurchases()) as unknown as BarPurchaseView[];
});

export const getBarSales = query(async (): Promise<BarSaleView[]> => {
  requirePermission('bar_sales:read');
  return unwrap(await listSales()) as unknown as BarSaleView[];
});

export const createDrink = form(
  v.object({
    drinkName:         v.pipe(v.string(), v.minLength(1, 'Name is required')),
    drinkCode:         v.pipe(v.string(), v.minLength(1, 'Code is required')),
    typeOfDrink:       v.picklist(['spirit', 'beer', 'rtd', 'wine', 'water']),
    uom:               v.picklist(['bottles', 'crates', 'pack']),
    packageQty:        v.pipe(v.number(), v.minValue(1, 'Must be at least 1')),
    buyingStockPrice:  v.pipe(v.number(), v.minValue(0, 'Cannot be negative')),
    sellingStockPrice: v.pipe(v.number(), v.minValue(0, 'Cannot be negative')),
  }),
  async (data) => {
    requirePermission('drinks:write');
    const created = unwrapForm(await dbCreateDrink(data));
    await getDrinks().refresh();
    return created;
  }
);

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
 * fields, so this one stays JS-driven and is submitted via `enhance`.
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
