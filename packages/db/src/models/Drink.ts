import { Schema, model, models, Document } from "mongoose";

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
  inStock: boolean;
  imageUrl: string;
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
    inStock: { type: Boolean, default: false },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const Drink = models.Drink ?? model<IDrink>("Drink", DrinkSchema);
