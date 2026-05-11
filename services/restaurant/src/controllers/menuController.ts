import { Request, Response } from "express";
import { MenuItem } from "@elmariam/db";

export async function getMenuItems(_req: Request, res: Response) {
  try {
    const items = await MenuItem.find();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function getOneMenuItem(req: Request, res: Response) {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, data: { message: "Menu item not found" } });
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function addMenuItem(req: Request, res: Response) {
  try {
    const item = await new MenuItem(req.body).save();
    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function updateMenuItem(req: Request, res: Response) {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, data: { message: "Menu item not found" } });
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, data: { message: "Menu item not found" } });
    }
    res.json({ success: true, data: { message: "Deleted" } });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
