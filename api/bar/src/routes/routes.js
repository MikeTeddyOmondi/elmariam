const express = require("express");
const router = express.Router();

const {
  verifyToken,
  verifyStaff,
  verifyAdmin,
} = require("../utils/verifyToken");

const { imageUploads } = require("../services/drinkImageUpload");

const {
  apiInfo,
  getBarDrinks,
  getOneBarDrink,
  addBarDrinks,
  getBarPurchases,
  getOneBarPurchase,
  postBarPurchases,
  getBarSales,
  getOneBarSale,
  postBarSales,
  lipaNaMpesa,
} = require("../controllers");

// API version information
router.get("/", verifyStaff, apiInfo);

// ___________________________________________
// Get/Post/Put/Delete | Bar Drinks
// ___________________________________________
router.get("/drinks", verifyStaff, getBarDrinks);
router.post("/drinks", verifyAdmin, imageUploads, addBarDrinks);

// Get/Put/Delete | Bar Drinks [ONE]
router.get("/drinks/:id", verifyAdmin, getOneBarDrink);
// router.put("/drinks/:id", verifyAdmin, imageUploads, updateOneBarDrink);
// router.delete("/drinks/:id", verifyAdmin, deleteOneBarDrinks);

// ___________________________________________
// Get/Post/Put/Delete | Bar Purchases
// ___________________________________________
router.get("/purchases", verifyAdmin, getBarPurchases);
router.post("/purchases", verifyAdmin, postBarPurchases);

// Get/Put/Delete | Bar Purchases [ONE]
router.get("/purchases/:id", verifyAdmin, getOneBarPurchase);
// router.put("/purchases/:id", verifyAdmin, updateOneBarPurchase);
// router.delete("/purchases/:id", verifyAdmin, deleteOneBarPurchase);

// ___________________________________________
// // Get/Post/Put/Delete | Bar Sales
// ___________________________________________
router.get("/sales", verifyStaff, getBarSales);
router.get("/sales", verifyStaff, postBarSales);
router.post("/sales/lipa-mpesa", verifyStaff, lipaNaMpesa);

// Get/Put/Delete | Bar Sales [ONE]
router.get("/sales/:id", verifyStaff, getOneBarSale);
// router.put("/sales/:id", verifyAdmin, updateOneBarSale);
// router.delete("/sales/:id", verifyAdmin, deleteOneBarSale);

module.exports = router;
