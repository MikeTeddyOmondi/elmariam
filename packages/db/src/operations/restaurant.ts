import { Result } from "better-result";
import { MenuItem, RestaurantOrder } from "../models";
import {
  MenuItemNotFoundError,
  OrderNotFoundError,
  RestaurantDatabaseError,
} from "../errors/restaurant";
import type { RestaurantError } from "../errors/restaurant";

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  category: "appetizer" | "main" | "dessert" | "beverage" | "side";
  price: number;
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> {}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderInput {
  tableNumber?: string;
  items: OrderItemInput[];
}

export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";

// ── Helpers ───────────────────────────────────────────────────────────────────

function dbErr(operation: string, e: unknown): RestaurantDatabaseError {
  return new RestaurantDatabaseError({
    operation,
    message: `${operation} failed: ${e instanceof Error ? e.message : String(e)}`,
    cause: e,
  });
}

// ── Menu Items ────────────────────────────────────────────────────────────────

export async function listMenuItems() {
  return Result.tryPromise({
    try: () => MenuItem.find().sort({ createdAt: -1 }).lean(),
    catch: (e) => dbErr("listMenuItems", e),
  });
}

export async function getMenuItem(id: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await MenuItem.findById(id).lean();
      if (!doc) throw new MenuItemNotFoundError({ id, message: "Menu item not found" });
      return doc;
    },
    catch: (e): RestaurantError => {
      if (e instanceof MenuItemNotFoundError) return e;
      return dbErr("getMenuItem", e);
    },
  });
}

export async function createMenuItem(input: CreateMenuItemInput) {
  return Result.tryPromise({
    try: () => MenuItem.create(input),
    catch: (e) => dbErr("createMenuItem", e),
  });
}

export async function updateMenuItem(id: string, input: UpdateMenuItemInput) {
  return Result.tryPromise({
    try: async () => {
      const doc = await MenuItem.findByIdAndUpdate(id, input, { new: true }).lean();
      if (!doc) throw new MenuItemNotFoundError({ id, message: "Menu item not found" });
      return doc;
    },
    catch: (e): RestaurantError => {
      if (e instanceof MenuItemNotFoundError) return e;
      return dbErr("updateMenuItem", e);
    },
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function listOrders() {
  return Result.tryPromise({
    try: () => RestaurantOrder.find().sort({ createdAt: -1 }).populate("orderCustomer"),
    catch: (e) => dbErr("listOrders", e),
  });
}

export async function getOrder(id: string) {
  return Result.tryPromise({
    try: async () => {
      const doc = await RestaurantOrder.findById(id).populate("orderCustomer");
      if (!doc) throw new OrderNotFoundError({ id, message: "Order not found" });
      return doc;
    },
    catch: (e): RestaurantError => {
      if (e instanceof OrderNotFoundError) return e;
      return dbErr("getOrder", e);
    },
  });
}

export async function createOrder(input: CreateOrderInput) {
  return Result.gen(async function* () {
    // Fetch all menu items in parallel
    const menuItems = yield* Result.await(
      Result.tryPromise({
        try: () => Promise.all(input.items.map((i) => MenuItem.findById(i.menuItemId))),
        catch: (e) => dbErr("createOrder.fetchMenuItems", e),
      })
    );

    // Build order line items and validate they all exist
    let totalAmount = 0;
    const orderItems: Array<{ menuItem: any; quantity: number; unitPrice: number; subtotal: number }> = [];

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const menuItem = menuItems[i];
      if (!menuItem) {
        return Result.err(
          new MenuItemNotFoundError({ id: item.menuItemId, message: `Menu item ${item.menuItemId} not found` })
        );
      }
      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;
      orderItems.push({ menuItem: menuItem._id, quantity: item.quantity, unitPrice: menuItem.price, subtotal });
    }

    const order = yield* Result.await(
      Result.tryPromise({
        try: () =>
          RestaurantOrder.create({
            tableNumber: input.tableNumber,
            items: orderItems,
            totalAmount,
            status: "pending",
            paymentStatus: "pending",
          }),
        catch: (e) => dbErr("createOrder.save", e),
      })
    );

    return Result.ok(order);
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return Result.tryPromise({
    try: async () => {
      const doc = await RestaurantOrder.findByIdAndUpdate(id, { status }, { new: true });
      if (!doc) throw new OrderNotFoundError({ id, message: "Order not found" });
      return doc;
    },
    catch: (e): RestaurantError => {
      if (e instanceof OrderNotFoundError) return e;
      return dbErr("updateOrderStatus", e);
    },
  });
}

export async function markOrderPaid(
  id: string,
  paymentMethod: "cash" | "mpesa" | "bank"
) {
  return Result.tryPromise({
    try: async () => {
      const doc = await RestaurantOrder.findByIdAndUpdate(
        id,
        { paymentStatus: "paid", paymentMethod },
        { new: true }
      );
      if (!doc) throw new OrderNotFoundError({ id, message: "Order not found" });
      return doc;
    },
    catch: (e): RestaurantError => {
      if (e instanceof OrderNotFoundError) return e;
      return dbErr("markOrderPaid", e);
    },
  });
}
