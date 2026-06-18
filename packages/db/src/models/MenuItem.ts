import { Schema, model, Document } from "mongoose";

export interface IMenuItem extends Document {
  id: string;
  name: string;
  description?: string;
  category: "appetizer" | "main" | "dessert" | "beverage" | "side";
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    category: {
      type: String,
      enum: ["appetizer", "main", "dessert", "beverage", "side"],
      required: true,
    },
    price: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String, required: false },
  },
  { timestamps: true }
);

export const MenuItem = model<IMenuItem>("MenuItem", MenuItemSchema);
