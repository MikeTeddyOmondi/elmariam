import mongoose, { Schema, model } from "mongoose";
import type { Document } from "mongoose";

export interface IDrink extends Document {
  id: string;
  drinkName: string;
  drinkCode: string;
  typeOfDrink: "spirit" | "beer" | "rtd" | "wine" | "water";
  uom: "bottles" | "crates" | "pack";
  packageQty: number;
  buyingPrice: number;
  sellingPrice: number;
  buyingStockPrice: number;
  sellingStockPrice: number;
  stockQty: number;
  /** Virtual, derived from `stockQty > 0`. Not stored, so it cannot drift. */
  inStock: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DrinkSchema = new Schema<IDrink>(
  {
    drinkName: { type: String, required: true },
    drinkCode: { type: String, unique: true, required: true },
    typeOfDrink: {
      type: String,
      enum: ["spirit", "beer", "rtd", "wine", "water"],
      required: true,
    },
    uom: {
      type: String,
      enum: ["bottles", "crates", "pack"],
      required: true,
    },
    packageQty: { type: Number, required: true },
    buyingPrice: { type: Number, required: false, default: 0 },
    sellingPrice: { type: Number, required: false, default: 0 },
    buyingStockPrice: { type: Number, required: true },
    sellingStockPrice: { type: Number, required: true },
    stockQty: { type: Number, default: 0 },
    // Optional: the multipart upload that supplied this was removed with the
    // gateway, and no surface accepts an image today. Requiring it made
    // createDrink fail for every submission the admin form can produce.
    imageUrl: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Derived at read time so it can never fall out of sync with stockQty.
// Read paths use `.lean({ virtuals: true })`, which materialises this.
DrinkSchema.virtual("inStock").get(function (this: { stockQty: number }) {
  return this.stockQty > 0;
});

export const Drink = mongoose.models['Drink'] ?? model<IDrink>("Drink", DrinkSchema);
