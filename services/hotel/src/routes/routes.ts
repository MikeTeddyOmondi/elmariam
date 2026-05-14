import { Router } from "express";
import {
  requireAuth,
  requireReceptionist,
  requireAdmin,
} from "@elmariam/auth";
import {
  getAllCustomers,
  addCustomer,
  getOneCustomer,
  searchCustomer,
} from "../controllers/customerController";
import {
  getAllBookings,
  getOneBooking,
  addBookings,
  initiateMpesaPayment,
  initiateSmsNotification,
} from "../controllers/bookingController";
import {
  getAllBookingInvoice,
  getBookingInvoice,
} from "../controllers/invoiceController";
import {
  fetchAllRooms,
  fetchOneRoom,
  allRoomTypes,
  createRoomType,
  createRoom,
} from "../controllers/roomController";

const router: Router = Router();

// API info
router.get("/", requireAuth, (req, res) => {
  res.json({ success: true, data: { version: "2.0.0", service: "hotel" } });
});

// Customers
router.get("/customers", requireReceptionist, getAllCustomers);
router.post("/customers", requireReceptionist, addCustomer);
router.get("/customers/:customerid", requireAuth, getOneCustomer);
router.get("/customers/search/:idnumber", requireAuth, searchCustomer);

// Bookings
router.get("/bookings", requireAuth, getAllBookings);
router.get("/bookings/:bookingid", requireAuth, getOneBooking);
router.post("/bookings", requireReceptionist, addBookings);

// Invoices
router.get("/invoices", requireAuth, getAllBookingInvoice);
router.get("/invoices/:invoiceid", requireAuth, getBookingInvoice);

// M-Pesa & SMS
router.post("/mpesa-payment/:bookingid", requireReceptionist, initiateMpesaPayment);
router.post("/sms/:bookingid", requireReceptionist, initiateSmsNotification);

// Rooms
router.get("/rooms", requireAdmin, fetchAllRooms);
router.get("/rooms/types", allRoomTypes);
router.post("/rooms/types", requireAdmin, createRoomType);
router.post("/rooms/:roomtypeid", requireAdmin, createRoom);
router.get("/rooms/:roomid", requireAdmin, fetchOneRoom);

export default router;
