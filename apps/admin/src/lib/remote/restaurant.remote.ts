import type { Result } from 'better-result';
import { query, command } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import * as v from 'valibot';
import {
  listMenuItems, listOrders,
  createMenuItem as dbCreateMenuItem,
  updateMenuItem as dbUpdateMenuItem,
  updateOrderStatus as dbUpdateOrderStatus,
} from '@elmariam/db';

function unwrap<T, E extends { message: string }>(result: Result<T, E>): T {
  return result.match({
    ok: (d) => JSON.parse(JSON.stringify(d)) as T,
    err: (e) => { throw httpError(400, e.message); },
  });
}

export type MenuItemView = {
  id: string;
  name: string;
  description?: string;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side';
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderView = {
  id: string;
  tableNumber?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  items: Array<{ menuItem: string; quantity: number; price: number }>;
  totalAmount: number;
  paymentMethod?: 'cash' | 'mpesa' | 'bank';
  paymentStatus: 'pending' | 'paid';
  createdAt: Date;
  updatedAt: Date;
};

export const getMenuItems = query(async (): Promise<MenuItemView[]> => unwrap(await listMenuItems()) as unknown as MenuItemView[]);
export const getOrders    = query(async (): Promise<OrderView[]> => unwrap(await listOrders()) as unknown as OrderView[]);

export const createMenuItem = command(
  v.object({
    name:        v.string(),
    description: v.optional(v.string()),
    category:    v.picklist(['appetizer', 'main', 'dessert', 'beverage', 'side']),
    price:       v.number(),
    isAvailable: v.optional(v.boolean()),
  }),
  async (data) => unwrap(await dbCreateMenuItem(data))
);

export const updateMenuItem = command(
  v.object({
    id:          v.string(),
    name:        v.optional(v.string()),
    description: v.optional(v.string()),
    category:    v.optional(v.picklist(['appetizer', 'main', 'dessert', 'beverage', 'side'])),
    price:       v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
  }),
  async ({ id, ...rest }) => unwrap(await dbUpdateMenuItem(id, rest))
);

export const updateOrderStatus = command(
  v.object({
    orderId: v.string(),
    status:  v.picklist(['pending', 'preparing', 'ready', 'served', 'cancelled']),
  }),
  async ({ orderId, status }) => unwrap(await dbUpdateOrderStatus(orderId, status))
);
