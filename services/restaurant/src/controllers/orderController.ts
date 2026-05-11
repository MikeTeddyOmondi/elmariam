import { Request, Response } from "express";
import { RestaurantOrder, MenuItem } from "@elmariam/db";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served"],
  served: [],
  cancelled: [],
};

export async function getOrders(_req: Request, res: Response) {
  try {
    const orders = await RestaurantOrder.find().populate("orderCustomer");
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function getOneOrder(req: Request, res: Response) {
  try {
    const order = await RestaurantOrder.findById(req.params.id).populate("orderCustomer");
    if (!order) {
      return res.status(404).json({ success: false, data: { message: "Order not found" } });
    }
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const { tableNumber, items, customer } = req.body as {
      tableNumber?: string;
      customer?: string;
      items: Array<{ menuItemId: string; quantity: number }>;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, data: { message: "items required" } });
    }

    // Fetch menu items and validate availability
    const menuItems = await Promise.all(
      items.map((i) => MenuItem.findById(i.menuItemId))
    );

    for (let i = 0; i < menuItems.length; i++) {
      const mi = menuItems[i];
      if (!mi) {
        return res.status(404).json({ success: false, data: { message: `Menu item ${items[i].menuItemId} not found` } });
      }
      if (!mi.isAvailable) {
        return res.status(400).json({ success: false, data: { message: `${mi.name} is not available` } });
      }
    }

    // Build order items and total
    let totalAmount = 0;
    const orderItems = items.map((item, i) => {
      const mi = menuItems[i]!;
      const subtotal = mi.price * item.quantity;
      totalAmount += subtotal;
      return {
        menuItem: mi._id,
        quantity: item.quantity,
        unitPrice: mi.price,
        subtotal,
      };
    });

    const order = await new RestaurantOrder({
      tableNumber,
      customer: customer || undefined,
      items: orderItems,
      totalAmount,
      status: "pending",
      paymentStatus: "pending",
    }).save();

    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { status } = req.body as { status: string };
    const order = await RestaurantOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, data: { message: "Order not found" } });
    }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        data: { message: `Cannot transition from '${order.status}' to '${status}'` },
      });
    }

    order.status = status as any;
    await order.save();
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function markOrderPaid(req: Request, res: Response) {
  try {
    const { paymentMethod } = req.body as { paymentMethod?: string };
    const order = await RestaurantOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, data: { message: "Order not found" } });
    }

    order.paymentStatus = "paid";
    if (paymentMethod) order.paymentMethod = paymentMethod as any;
    await order.save();
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
