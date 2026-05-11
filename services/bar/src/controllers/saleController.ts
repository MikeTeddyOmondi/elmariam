import { Request, Response } from "express";
import { BarSale, Drink } from "@elmariam/db";
import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue";

export async function getBarSales(_req: Request, res: Response) {
  try {
    const sales = await BarSale.find().populate("drinksBought");
    res.json({ success: true, data: sales });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function getOneBarSale(req: Request, res: Response) {
  try {
    // Fix: was using undefined `saleID` — use `salesId` (req.params.id)
    const salesId = req.params.id;
    const sale = await BarSale.find({ _id: salesId });
    if (!sale || sale.length === 0) {
      return res.status(404).json({ success: false, data: { message: "Sale not found" } });
    }
    res.json({ success: true, data: sale[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function postBarSales(req: Request, res: Response) {
  try {
    const { checkoutDrinkItems } = req.body as {
      checkoutDrinkItems: Array<{ drinkId: string; quantity: number }>;
    };

    if (!checkoutDrinkItems || !Array.isArray(checkoutDrinkItems) || checkoutDrinkItems.length === 0) {
      return res.status(400).json({ success: false, data: { message: "checkoutDrinkItems required" } });
    }

    // Fetch all drink details in parallel
    const drinks = await Promise.all(
      checkoutDrinkItems.map((item) => Drink.findById(item.drinkId))
    );

    // Check stock
    const stockIssues: string[] = [];
    for (let i = 0; i < checkoutDrinkItems.length; i++) {
      const drink = drinks[i];
      const item = checkoutDrinkItems[i];
      if (!drink || drink.stockQty < item.quantity) {
        stockIssues.push(drink?.drinkName || item.drinkId);
      }
    }

    if (stockIssues.length > 0) {
      return res.status(500).json({
        success: false,
        data: { message: "Out of stock or insufficient stock!", items: stockIssues },
      });
    }

    // Build sale details and total
    let totalStockValue = 0;
    const drinksSaleDetails = checkoutDrinkItems.map((item, i) => {
      const drink = drinks[i]!;
      const stockValue = drink.sellingPrice * item.quantity;
      totalStockValue += stockValue;
      return {
        productID: drink._id,
        qtyBought: item.quantity,
        stockValue,
      };
    });

    const sale = await new BarSale({
      drinks: drinksSaleDetails,
      totalStockValue,
    }).save();

    // Decrement stock for each drink
    await Promise.all(
      checkoutDrinkItems.map((item) =>
        Drink.updateOne({ _id: item.drinkId }, { $inc: { stockQty: -item.quantity } })
      )
    );

    res.status(201).json({
      success: true,
      data: { message: "Sale completed", totalStockValue, salesId: sale._id },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function lipaNaMpesa(req: Request, res: Response) {
  // Stub — publishes bar sale to mpesa queue
  try {
    const salesId = req.params.id;
    const sale = await BarSale.findById(salesId);
    if (!sale) {
      return res.status(404).json({ success: false, data: { message: "Sale not found" } });
    }

    const message = {
      api_ref: `bar-elmariam-sale-${salesId}`,
      amount: sale.totalStockValue,
    };

    const queue = new RabbitMQConfig(rabbitMQEnvFromProcess());
    await queue.connect();
    await queue.createQueue("mpesa");
    await queue.publishToQueue("mpesa", message);
    await queue.close();

    res.json({ success: true, data: { message: "M-Pesa payment initiated" } });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
