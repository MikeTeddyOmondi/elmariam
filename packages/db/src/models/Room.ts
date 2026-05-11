import { Schema, model, Document } from "mongoose";

export interface IRoom extends Document {
  number: string;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    number: { type: String, required: true, unique: true },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Room = model<IRoom>("Room", RoomSchema);
