import { Request, Response } from "express";
import {
  Booking,
  Invoice,
  Customer,
  Room,
  RoomType,
} from "@elmariam/db";
import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue";
import { getDatesInRange } from "../utils/helpers";

export async function getAllBookings(req: Request, res: Response) {
  try {
    const bookings = await Booking.find()
      .populate("occupant")
      .populate("room-type")
      .populate("invoice");
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function getOneBooking(req: Request, res: Response) {
  try {
    const booking = await Booking.findById(req.params.bookingid)
      .populate("occupant")
      .populate("room-type")
      .populate("invoice");
    if (!booking) {
      return res.status(404).json({ success: false, data: { message: "Booking not found" } });
    }
    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function addBookings(req: Request, res: Response) {
  try {
    const {
      customerId,
      numberAdults,
      numberKids,
      roomType: roomTypeStr,
      checkInDate,
      checkOutDate,
      paymentMethod,
    } = req.body;

    if (!customerId || !numberAdults || !roomTypeStr || !checkInDate || !checkOutDate || !paymentMethod) {
      return res.status(400).json({ success: false, data: { message: "Missing required fields" } });
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn < today) {
      return res.status(400).json({ success: false, data: { message: "Check-in date cannot be in the past" } });
    }
    if (checkOut < checkIn) {
      return res.status(400).json({ success: false, data: { message: "Check-out date must be on or after check-in date" } });
    }

    // Lookup customer by ID number
    const customer = await Customer.findOne({ id_number: customerId });
    if (!customer) {
      return res.status(404).json({ success: false, data: { message: "Customer not found" } });
    }

    // Lookup room type
    const roomTypeDoc = await RoomType.findOne({ roomType: roomTypeStr });
    if (!roomTypeDoc) {
      return res.status(404).json({ success: false, data: { message: "Room type not found" } });
    }

    // Check room availability
    const availableRooms = await Room.find({ isBooked: false });
    const availableRoomIds = availableRooms.map((r) => r._id.toString());
    const typeRoomIds = roomTypeDoc.rooms.map((id) => id.toString());
    const matchingRooms = availableRooms.filter((r) =>
      typeRoomIds.includes(r._id.toString())
    );

    if (matchingRooms.length === 0) {
      return res.status(500).json({ success: false, data: { message: "No rooms available" } });
    }

    // Pick random available room
    const randomIndex = Math.floor(Math.random() * matchingRooms.length);
    const selectedRoom = matchingRooms[randomIndex];

    // Calculate invoice
    const diffinDays = Math.max(
      1,
      Math.ceil(Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    );
    const guests = Number(numberAdults) + Number(numberKids || 0);
    const subTotalCost = roomTypeDoc.rate * diffinDays * guests;
    const vat = 0.16 * subTotalCost;
    const totalCost = subTotalCost + vat;

    // Create invoice (no bookingRef yet)
    const invoice = new Invoice({
      status: "pending",
      paymentMethod,
      vat,
      subTotalCost,
      totalCost,
    });
    await invoice.save();

    // Create booking
    const booking = new Booking({
      customer: customer._id,
      numberAdults,
      numberKids: numberKids || 0,
      roomType: roomTypeDoc._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      invoiceRef: invoice._id,
    });
    await booking.save();

    // Back-reference booking in invoice
    invoice.bookingRef = booking._id as any;
    await invoice.save();

    // Update room type availability
    const datesInRange = getDatesInRange(checkIn, checkOut);
    roomTypeDoc.reservations.bookingRef.push(booking._id as any);
    datesInRange.forEach((d) => roomTypeDoc.reservations.unavailableDates.push(new Date(d)));
    await roomTypeDoc.save();

    // Mark room as booked
    selectedRoom.isBooked = true;
    await selectedRoom.save();

    res.status(201).json({
      success: true,
      data: { booking, invoice, room: selectedRoom },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function initiateMpesaPayment(req: Request, res: Response) {
  try {
    const booking = await Booking.findById(req.params.bookingid)
      .populate("occupant")
      .populate("room-type")
      .populate("invoice");

    if (!booking) {
      return res.status(404).json({ success: false, data: { message: "Booking not found" } });
    }

    const customer = booking.get("occupant") as any;
    const invoice = booking.get("invoice") as any;

    const message = {
      first_name: customer?.firstname,
      last_name: customer?.lastname,
      email: customer?.email,
      host: process.env.INTASEND_HOST || "hotel-elmariam",
      amount: invoice?.totalCost,
      phone_number: customer?.phone_number,
      api_ref: `hotel-elmariam-booking-${booking._id}`,
    };

    const queue = new RabbitMQConfig(rabbitMQEnvFromProcess());
    await queue.connect();
    await queue.createQueue("mpesa");
    await queue.publishToQueue("mpesa", message);
    await queue.close();

    res.json({ success: true, data: { message: "Payment initiated" } });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}

export async function initiateSmsNotification(req: Request, res: Response) {
  try {
    const booking = await Booking.findById(req.params.bookingid)
      .populate("occupant")
      .populate("room-type")
      .populate("invoice");

    if (!booking) {
      return res.status(404).json({ success: false, data: { message: "Booking not found" } });
    }

    const customer = booking.get("occupant") as any;
    const invoice = booking.get("invoice") as any;
    const checkOut = new Date(booking.checkOutDate).toDateString();

    const msgText = `Greetings ${customer?.firstname}. Your hotel booking invoice of amount Kes. ${invoice?.totalCost} is due on ${checkOut}`;
    const phoneStr = String(customer?.phone_number || "");
    const phoneNumbers = "0" + phoneStr.slice(3); // 254XXXXXXXXX → 0XXXXXXXXX

    const payload = { message: msgText, phoneNumbers };

    const queue = new RabbitMQConfig(rabbitMQEnvFromProcess());
    await queue.connect();
    await queue.createQueue("sms");
    await queue.publishToQueue("sms", payload);
    await queue.close();

    res.json({ success: true, data: { message: "SMS notification sent" } });
  } catch (err: any) {
    res.status(500).json({ success: false, data: { message: err.message } });
  }
}
