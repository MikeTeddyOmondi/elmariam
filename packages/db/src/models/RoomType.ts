import mongoose, { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";

export interface IRoomType extends Document {
  id: string;
  title: string;
  description: string;
  rate: number;
  capacity: number;
  roomType: "single" | "double";
  rooms: Types.ObjectId[];
  reservations: {
    bookingRef: Types.ObjectId[];
    unavailableDates: Date[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    rate: { type: Number, required: true },
    capacity: { type: Number, required: true },
    roomType: {
      type: String,
      enum: ["single", "double"],
      unique: true,
      required: true,
    },
    rooms: { type: [Schema.Types.ObjectId] },
    reservations: {
      bookingRef: { type: [Schema.Types.ObjectId] },
      unavailableDates: { type: [Date] },
    },
  },
  { timestamps: true }
);

RoomTypeSchema.virtual("room", {
  ref: "Room",
  localField: "rooms",
  foreignField: "_id",
  justOne: false,
});

RoomTypeSchema.virtual("booking", {
  ref: "Booking",
  localField: "reservations.bookingRef",
  foreignField: "_id",
  justOne: true,
});

export const RoomType = mongoose.models['RoomType'] ?? model<IRoomType>("RoomType", RoomTypeSchema);
