import mongoose, { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";

export interface ICustomer extends Document {
  id: string;
  firstname: string;
  lastname: string;
  id_number: string;
  email: string;
  phone_number?: number;
  /** The signed-in account this profile belongs to. Absent on walk-in
   *  customers created by staff until that person signs up with the same email. */
  user?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    id_number: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone_number: { type: Number, required: false },
    // Sparse: unique among linked profiles, while unlinked walk-ins have none.
    user: { type: Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
  },
  { timestamps: true }
);

export const Customer = mongoose.models['Customer'] ?? model<ICustomer>("Customer", CustomerSchema);
