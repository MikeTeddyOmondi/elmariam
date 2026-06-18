import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  id_number: string;
  phone_number?: number;
  userType: "admin" | "customer" | "receptionist" | "barista" | "waiter" | "management";
  openauth_subject_id?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    firstname: { type: String, required: false, default: "" },
    lastname: { type: String, required: false, default: "" },
    email: { type: String, required: true },
    id_number: { type: String, required: true, unique: true },
    phone_number: { type: Number, required: false },
    userType: {
      type: String,
      enum: ["admin", "customer", "receptionist", "barista", "waiter", "management"],
      required: true,
    },
    openauth_subject_id: { type: String, required: false },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
