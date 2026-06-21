import { Schema, model, models, Document, Types } from "mongoose";

export interface IInvoice extends Document {
  id: string;
  bookingRef: Types.ObjectId;
  status: "paid" | "pending";
  paymentMethod: "cash" | "mpesa" | "bank";
  vat: number;
  subTotalCost: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    bookingRef: { type: Schema.Types.ObjectId, ref: "Booking" },
    status: {
      type: String,
      enum: ["paid", "pending"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "bank"],
      required: true,
    },
    vat: { type: Number, required: true },
    subTotalCost: { type: Number, required: true },
    totalCost: { type: Number, required: true },
  },
  { timestamps: true }
);

InvoiceSchema.virtual("booking", {
  ref: "Booking",
  localField: "bookingRef",
  foreignField: "_id",
  justOne: true,
});

export const Invoice = models.Invoice ?? model<IInvoice>("Invoice", InvoiceSchema);
