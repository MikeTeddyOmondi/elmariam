import { Request, Response } from "express";
import { Customer } from "@elmariam/db";

export async function getAllCustomers(req: Request, res: Response) {
  try {
    const customers = await Customer.find();
    res.json({ success: true, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function addCustomer(req: Request, res: Response) {
  try {
    const customer = await new Customer(req.body).save();
    res.status(201).json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function getOneCustomer(req: Request, res: Response) {
  try {
    const customer = await Customer.findById(req.params.customerid);
    if (!customer) {
      return res.status(404).json({ success: false, data: { message: "Customer not found" } });
    }
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function searchCustomer(req: Request, res: Response) {
  try {
    const customer = await Customer.findOne({ id_number: req.params.idnumber });
    if (!customer) {
      return res.status(404).json({ success: false, data: { message: "Customer not found" } });
    }
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
