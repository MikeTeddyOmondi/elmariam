import { Schema, model, Document, Types } from "mongoose";

interface BarSaleDrink {
  productID: Types.ObjectId;
  qtyBought: number;
  stockValue: number;
}

export interface IBarSale extends Document {
  customer?: Types.ObjectId;
  drinks: BarSaleDrink[];
  totalStockValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const BarSaleSchema = new Schema<IBarSale>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    drinks: [
      {
        _id: false,
        productID: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Drink",
        },
        qtyBought: { type: Number, required: true },
        stockValue: { type: Number, required: true },
      },
    ],
    totalStockValue: {
      type: Number,
      default: function (this: IBarSale) {
        return this.drinks.reduce((prev, cur) => prev + cur.stockValue, 0);
      },
    },
  },
  { timestamps: true }
);

BarSaleSchema.virtual("drinksBought", {
  ref: "Drink",
  localField: "drinks.productID",
  foreignField: "_id",
  justOne: true,
});

export const BarSale = model<IBarSale>("BarSale", BarSaleSchema);
