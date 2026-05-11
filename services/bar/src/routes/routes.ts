import { Router } from "express";
import { requireBarista, requireAdmin } from "@elmariam/auth";
import { upload } from "../config/minio";
import { getBarDrinks, getOneBarDrink, addBarDrinks } from "../controllers/drinkController";
import { getBarPurchases, getOneBarPurchase, postBarPurchases } from "../controllers/purchaseController";
import { getBarSales, getOneBarSale, postBarSales, lipaNaMpesa } from "../controllers/saleController";

const router = Router();

// API info
router.get("/", requireBarista, (_req, res) => {
  res.json({ success: true, data: { version: "2.0.0", service: "bar" } });
});

// Drinks
router.get("/drinks", requireBarista, getBarDrinks);
router.post("/drinks", requireAdmin, upload.single("file"), addBarDrinks);
router.get("/drinks/:id", requireBarista, getOneBarDrink);

// Purchases
router.get("/purchases", requireAdmin, getBarPurchases);
router.post("/purchases", requireAdmin, postBarPurchases);
router.get("/purchases/:id", requireAdmin, getOneBarPurchase);

// Sales — lipa-mpesa route must come before :id to avoid route conflict
router.get("/sales", requireBarista, getBarSales);
router.post("/sales", requireBarista, postBarSales);
router.post("/sales/lipa-mpesa/:id", requireBarista, lipaNaMpesa);
router.get("/sales/:id", requireBarista, getOneBarSale);

export default router;
