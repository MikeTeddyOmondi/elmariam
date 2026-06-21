import { Result } from "better-result";
import { Drink, BarPurchase, BarSale } from "../models";
import type { IDrink } from "../models";
import {
  DrinkAlreadyExistsError,
  DrinkNotFoundError,
  InsufficientStockError,
  BarDatabaseError,
} from "../errors/bar";
import type { BarError } from "../errors/bar";

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateDrinkInput {
  drinkName: string;
  drinkCode: string;
  typeOfDrink: "spirit" | "beer" | "rtd" | "wine" | "water";
  uom: "bottles" | "crates" | "pack";
  packageQty: number;
  buyingStockPrice: number;
  sellingStockPrice: number;
  imageUrl?: string;
}

export interface CreatePurchaseInput {
  receiptNumber: string;
  product: string;
  quantity: number;
  supplier: string;
}

export interface CheckoutDrinkItem {
  drinkId: string;
  quantity: number;
}

export interface CreateSaleInput {
  checkoutDrinkItems: CheckoutDrinkItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function withId<T extends { _id: any }>(doc: T): T & { id: string } {
  return { ...doc, id: String(doc._id) };
}

function dbErr(operation: string, e: unknown): BarDatabaseError {
  return new BarDatabaseError({
    operation,
    message: `${operation} failed: ${e instanceof Error ? e.message : String(e)}`,
    cause: e,
  });
}

// ── Drinks ────────────────────────────────────────────────────────────────────

export async function listDrinks() {
  return Result.tryPromise({
    try: async () => (await Drink.find().sort({ createdAt: -1 }).lean<IDrink[]>({ virtuals: true })).map(withId),
    catch: (e) => dbErr("listDrinks", e),
  });
}

export async function getDrink(id: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await Drink.findById(id).lean<IDrink>({ virtuals: true });
      if (!doc) throw new DrinkNotFoundError({ id, message: "Drink not found" });
      return withId(doc);
    },
    catch: (e): BarError => {
      if (e instanceof DrinkNotFoundError) return e;
      return dbErr("getDrink", e);
    },
  });
}

export async function createDrink(input: CreateDrinkInput) {
  return Result.tryPromise({
    try: () => Drink.create(input),
    catch: (e: any): BarError => {
      if (e.code === 11000) {
        const field = Object.keys(e.keyPattern ?? {})[0] ?? "field";
        return new DrinkAlreadyExistsError({
          field,
          message: `A drink with that ${field.replace(/_/g, " ")} already exists.`,
        });
      }
      return dbErr("createDrink", e);
    },
  });
}

// ── Purchases ─────────────────────────────────────────────────────────────────

export async function listPurchases() {
  return Result.tryPromise({
    try: () => BarPurchase.find().populate("drink").sort({ createdAt: -1 }),
    catch: (e) => dbErr("listPurchases", e),
  });
}

export async function createPurchase(input: CreatePurchaseInput) {
  return Result.gen(async function* () {
    const drink = yield* Result.await(
      Result.tryPromise({
        try: async () => {
          const doc = await Drink.findById(input.product);
          if (!doc) throw new DrinkNotFoundError({ id: input.product, message: "Drink not found" });
          return doc;
        },
        catch: (e): BarError => {
          if (e instanceof DrinkNotFoundError) return e;
          return dbErr("createPurchase.findDrink", e);
        },
      })
    );

    const stockValue =
      drink.uom === "bottles"
        ? drink.buyingStockPrice * input.quantity
        : drink.buyingStockPrice * (input.quantity / 24);

    const purchase = yield* Result.await(
      Result.tryPromise({
        try: () =>
          new BarPurchase({
            receiptNumber: input.receiptNumber,
            product: drink._id,
            quantity: input.quantity,
            stockValue,
            supplier: input.supplier,
          }).save(),
        catch: (e) => dbErr("createPurchase.save", e),
      })
    );

    yield* Result.await(
      Result.tryPromise({
        try: () =>
          Drink.updateOne(
            { _id: drink._id },
            { $set: { inStock: true, stockQty: drink.stockQty + input.quantity } }
          ),
        catch: (e) => dbErr("createPurchase.updateStock", e),
      })
    );

    return Result.ok(purchase);
  });
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export async function listSales() {
  return Result.tryPromise({
    try: () => BarSale.find().populate("drinksBought").sort({ createdAt: -1 }),
    catch: (e) => dbErr("listSales", e),
  });
}

export async function getSale(id: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await BarSale.findById(id);
      if (!doc) throw new DrinkNotFoundError({ id, message: "Sale not found" });
      return doc;
    },
    catch: (e): BarError => {
      if (e instanceof DrinkNotFoundError) return e;
      return dbErr("getSale", e);
    },
  });
}

export async function createSale(input: CreateSaleInput) {
  return Result.gen(async function* () {
    // Fetch all drinks in parallel
    const drinks = yield* Result.await(
      Result.tryPromise({
        try: () =>
          Promise.all(input.checkoutDrinkItems.map((item) => Drink.findById(item.drinkId))),
        catch: (e) => dbErr("createSale.fetchDrinks", e),
      })
    );

    // Validate stock for each item
    for (let i = 0; i < input.checkoutDrinkItems.length; i++) {
      const drink = drinks[i];
      const item = input.checkoutDrinkItems[i];
      if (!drink) {
        return Result.err(
          new DrinkNotFoundError({ id: item.drinkId, message: `Drink ${item.drinkId} not found` })
        );
      }
      if (drink.stockQty < item.quantity) {
        return Result.err(
          new InsufficientStockError({
            drinkId: item.drinkId,
            requested: item.quantity,
            available: drink.stockQty,
            message: `Insufficient stock for "${drink.drinkName}": requested ${item.quantity}, available ${drink.stockQty}`,
          })
        );
      }
    }

    // Build sale line items
    let totalStockValue = 0;
    const drinksSaleDetails = input.checkoutDrinkItems.map((item, i) => {
      const drink = drinks[i]!;
      const stockValue = drink.sellingPrice * item.quantity;
      totalStockValue += stockValue;
      return { productID: drink._id, qtyBought: item.quantity, stockValue };
    });

    const sale = yield* Result.await(
      Result.tryPromise({
        try: () => new BarSale({ drinks: drinksSaleDetails, totalStockValue }).save(),
        catch: (e) => dbErr("createSale.save", e),
      })
    );

    // Decrement stock
    yield* Result.await(
      Result.tryPromise({
        try: () =>
          Promise.all(
            input.checkoutDrinkItems.map((item) =>
              Drink.updateOne({ _id: item.drinkId }, { $inc: { stockQty: -item.quantity } })
            )
          ),
        catch: (e) => dbErr("createSale.decrementStock", e),
      })
    );

    return Result.ok({ sale, totalStockValue });
  });
}
