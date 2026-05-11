import { Request, Response } from "express";
import { BarPurchase, Drink } from "@elmariam/db";

export async function getBarPurchases(_req: Request, res: Response) {
  try {
    const purchases = await BarPurchase.find().populate("drink");
    res.json({ success: true, data: purchases });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function getOneBarPurchase(req: Request, res: Response) {
  try {
    const purchase = await BarPurchase.findById(req.params.id).populate("drink");
    if (!purchase) {
      return res.status(404).json({ success: false, data: { message: "Purchase not found" } });
    }
    res.json({ success: true, data: purchase });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function postBarPurchases(req: Request, res: Response) {
  try {
    const { receiptNumber, product, quantity, supplier } = req.body;

    if (!receiptNumber || !product || !quantity || !supplier) {
      return res.status(400).json({ success: false, data: { message: "Missing required fields" } });
    }

    const drink = await Drink.findById(product);
    if (!drink) {
      return res.status(404).json({ success: false, data: { message: "Drink not found" } });
    }

    // Calculate stock value
    let stockValue: number;
    if (drink.uom === "bottles") {
      stockValue = drink.buyingStockPrice * Number(quantity);
    } else {
      // crates or pack: divide by 24
      stockValue = drink.buyingStockPrice * (Number(quantity) / 24);
    }

    const purchase = await new BarPurchase({
      receiptNumber,
      product: drink._id,
      quantity: Number(quantity),
      stockValue,
      supplier,
    }).save();

    await Drink.updateOne(
      { _id: drink._id },
      { $set: { inStock: true, stockQty: drink.stockQty + Number(quantity) } }
    );

    res.status(201).json({ success: true, data: purchase });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
