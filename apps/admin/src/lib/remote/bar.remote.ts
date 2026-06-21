import type { Result } from 'better-result';
import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import { listDrinks, listPurchases, listSales, createDrink as dbCreateDrink, createPurchase, createSale } from '@elmariam/db';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
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

export const getDrinks       = query(async (): Promise<DrinkView[]> => unwrap(await listDrinks()) as unknown as DrinkView[]);
export const getBarPurchases = query(async (): Promise<BarPurchaseView[]> => unwrap(await listPurchases()) as unknown as BarPurchaseView[]);
export const getBarSales     = query(async (): Promise<BarSaleView[]> => unwrap(await listSales()) as unknown as BarSaleView[]);

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
