import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  id_number: string;
  phone_number?: number;
  userType: 'customer' | 'staff' | 'management';
  isAdmin: boolean;
  isActive: boolean;
  isVerified: boolean;
  resetLink: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    firstname: { type: String, default: '' },
    lastname: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    id_number: { type: String, required: true, unique: true },
    phone_number: { type: Number },
    userType: {
      type: String,
      enum: ['customer', 'staff', 'management'],
      required: true,
    },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    resetLink: { type: String, default: '' },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
