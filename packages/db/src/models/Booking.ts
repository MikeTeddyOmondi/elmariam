import mongoose, { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";
import type { IInvoice } from "./Invoice";

export interface IBooking extends Document {
  id: string;
  customer: Types.ObjectId;
  numberAdults: number;
  numberKids: number;
  roomType: Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  invoiceRef: Types.ObjectId;
  invoice?: IInvoice;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    numberAdults: { type: Number, required: true },
    numberKids: { type: Number, required: true },
    roomType: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "RoomType",
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    invoiceRef: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Invoice",
    },
  },
  { timestamps: true }
);

BookingSchema.virtual("occupant", {
  ref: "Customer",
  localField: "customer",
  foreignField: "_id",
  justOne: true,
});

BookingSchema.virtual("room-type", {
  ref: "RoomType",
  localField: "roomType",
  foreignField: "_id",
  justOne: true,
});

BookingSchema.virtual("invoice", {
  ref: "Invoice",
  localField: "invoiceRef",
  foreignField: "_id",
  justOne: true,
});

export const Booking = mongoose.models['Booking'] ?? model<IBooking>("Booking", BookingSchema);
