import { Schema, model, Document, Types } from "mongoose";

export interface IBarPurchase extends Document {
  id: string;
  receiptNumber: string;
  product: Types.ObjectId;
  quantity: number;
  stockValue: number;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
}

const BarPurchaseSchema = new Schema<IBarPurchase>(
  {
    receiptNumber: { type: String, required: true },
    product: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Drink",
    },
    quantity: { type: Number, required: true },
    stockValue: { type: Number, required: true },
    supplier: { type: String, required: true },
  },
  { timestamps: true }
);

BarPurchaseSchema.virtual("drink", {
  ref: "Drink",
  localField: "product",
  foreignField: "_id",
  justOne: true,
});

export const BarPurchase = model<IBarPurchase>("BarPurchase", BarPurchaseSchema);
