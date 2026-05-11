import { Request, Response } from "express";
import { Drink } from "@elmariam/db";
import { S3_HOSTNAME, BUCKET_NAME } from "../config/minio";

const VALID_DRINK_TYPES = ["spirit", "beer", "rtd", "wine", "water"];
const VALID_UOM = ["bottles", "crates", "pack"];

export async function getBarDrinks(_req: Request, res: Response) {
  try {
    const drinks = await Drink.find();
    res.json({ success: true, data: drinks });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function getOneBarDrink(req: Request, res: Response) {
  try {
    const drink = await Drink.findById(req.params.id);
    if (!drink) {
      return res.status(404).json({ success: false, data: { message: "Drink not found" } });
    }
    res.json({ success: true, data: drink });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function addBarDrinks(req: Request, res: Response) {
  try {
    const { drinkName, drinkCode, typeOfDrink, uom, packageQty, buyingPrice, sellingPrice } = req.body;

    if (!drinkName || !drinkCode || !typeOfDrink || !uom || !packageQty || !buyingPrice || !sellingPrice) {
      return res.status(400).json({ success: false, data: { message: "Missing required fields" } });
    }
    if (!VALID_DRINK_TYPES.includes(typeOfDrink)) {
      return res.status(400).json({ success: false, data: { message: "Invalid typeOfDrink" } });
    }
    if (!VALID_UOM.includes(uom)) {
      return res.status(400).json({ success: false, data: { message: "Invalid uom" } });
    }

    // Check unique drink code
    const existing = await Drink.findOne({ drinkCode });
    if (existing) {
      return res.status(409).json({ success: false, data: { message: "Drink code already exists" } });
    }

    // Build image URL from uploaded file
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, data: { message: "Image file required" } });
    }
    const imageUrl = `https://${S3_HOSTNAME}/${BUCKET_NAME}/${file.path || file.key || file.originalname}`;

    // Calculate per-unit prices
    const qty = Number(packageQty);
    const buyingStockPrice = Number(buyingPrice);
    const sellingStockPrice = Number(sellingPrice);
    let unitBuyingPrice = buyingStockPrice;
    let unitSellingPrice = sellingStockPrice;

    if (uom === "crates" || uom === "pack") {
      unitBuyingPrice = buyingStockPrice / qty;
      unitSellingPrice = sellingStockPrice / qty;
    }

    const drink = await new Drink({
      drinkName,
      drinkCode,
      typeOfDrink,
      uom,
      packageQty: qty,
      buyingPrice: unitBuyingPrice,
      sellingPrice: unitSellingPrice,
      buyingStockPrice,
      sellingStockPrice,
      imageUrl,
    }).save();

    res.status(201).json({ success: true, data: drink });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
