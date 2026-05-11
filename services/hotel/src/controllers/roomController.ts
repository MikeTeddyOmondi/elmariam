import { Request, Response } from "express";
import { Room, RoomType } from "@elmariam/db";

export async function fetchAllRooms(req: Request, res: Response) {
  try {
    const rooms = await Room.find();
    res.json({ success: true, data: rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function fetchOneRoom(req: Request, res: Response) {
  try {
    const room = await Room.findById(req.params.roomid);
    if (!room) {
      return res.status(404).json({ success: false, data: { message: "Room not found" } });
    }
    res.json({ success: true, data: room });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function allRoomTypes(req: Request, res: Response) {
  try {
    const roomTypes = await RoomType.find().populate("room").populate("booking");
    res.json({ success: true, data: roomTypes });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function createRoomType(req: Request, res: Response) {
  try {
    const roomType = await new RoomType(req.body).save();
    res.status(201).json({ success: true, data: roomType });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function createRoom(req: Request, res: Response) {
  try {
    const newRoom = await new Room(req.body).save();
    const result = await RoomType.updateOne(
      { _id: req.params.roomtypeid },
      { $push: { rooms: newRoom._id } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, data: { message: "Room type not found" } });
    }
    res.status(201).json({ success: true, data: newRoom });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
