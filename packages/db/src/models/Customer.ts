import { Schema, model, Document } from "mongoose";

export interface ICustomer extends Document {
  id: string;
  firstname: string;
  lastname: string;
  id_number: string;
  email: string;
  phone_number?: number;
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
  },
  { timestamps: true }
);

export const Customer = model<ICustomer>("Customer", CustomerSchema);
