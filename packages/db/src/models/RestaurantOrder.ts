import { Schema, model, models, Document, Types } from "mongoose";

interface OrderItem {
  menuItem: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IRestaurantOrder extends Document {
  id: string;
  customer?: Types.ObjectId;
  tableNumber?: string;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  items: OrderItem[];
  totalAmount: number;
  paymentMethod?: "cash" | "mpesa" | "bank";
  paymentStatus: "pending" | "paid";
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantOrderSchema = new Schema<IRestaurantOrder>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    tableNumber: { type: String, required: false },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled"],
      default: "pending",
      required: true,
    },
    items: [
      {
        _id: false,
        menuItem: {
          type: Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        subtotal: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      default: function (this: IRestaurantOrder) {
        return this.items.reduce((prev, cur) => prev + cur.subtotal, 0);
      },
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "bank"],
      required: false,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

RestaurantOrderSchema.virtual("orderCustomer", {
  ref: "Customer",
  localField: "customer",
  foreignField: "_id",
  justOne: true,
});

export const RestaurantOrder = models.RestaurantOrder ?? model<IRestaurantOrder>("RestaurantOrder", RestaurantOrderSchema);
