import { Request, Response } from "express";
import { Invoice } from "@elmariam/db";

export async function getAllBookingInvoice(req: Request, res: Response) {
  try {
    const invoices = await Invoice.find().populate("booking");
    res.json({ success: true, data: invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function getBookingInvoice(req: Request, res: Response) {
  try {
    const invoice = await Invoice.findById(req.params.invoiceid).populate("booking");
    if (!invoice) {
      return res.status(404).json({ success: false, data: { message: "Invoice not found" } });
    }
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
