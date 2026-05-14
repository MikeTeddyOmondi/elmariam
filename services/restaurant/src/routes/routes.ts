import { Router } from "express";
import { requireAuth, requireAdmin, requireWaiter } from "@elmariam/auth";
import { getMenuItems, getOneMenuItem, addMenuItem, updateMenuItem, deleteMenuItem } from "../controllers/menuController";
import { getOrders, getOneOrder, createOrder, updateOrderStatus, markOrderPaid } from "../controllers/orderController";

const router: Router = Router();

router.get("/", requireAuth, (_req, res) => {
  res.json({ success: true, data: { version: "2.0.0", service: "restaurant" } });
});

// Menu
router.get("/menu", getMenuItems);
router.post("/menu", requireAdmin, addMenuItem);
router.get("/menu/:id", requireAuth, getOneMenuItem);
router.put("/menu/:id", requireAdmin, updateMenuItem);
router.delete("/menu/:id", requireAdmin, deleteMenuItem);

// Orders
router.get("/orders", requireWaiter, getOrders);
router.post("/orders", requireWaiter, createOrder);
router.get("/orders/:id", requireWaiter, getOneOrder);
router.put("/orders/:id/status", requireWaiter, updateOrderStatus);
router.put("/orders/:id/payment", requireWaiter, markOrderPaid);

export default router;
