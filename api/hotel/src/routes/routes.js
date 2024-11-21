const express = require("express");
const router = express.Router();

const {
  verifyToken,
  verifyUser,
  verifyStaff,
  verifyAdmin,
} = require("../utils/verifyToken");

const {
  ApiInfo,
  getAllCustomers,
  addCustomer,
  searchCustomer,
  getAllBookings,
  getOneBooking,
  addBookings,
  getAllBookingInvoice,
  getBookingInvoice,
  createRoom,
  createRoomType,
  fetchOneRoom,
  allRoomTypes,
  fetchAllRooms,
  getOneCustomer,
  initiateMpesaPayment,
  initiateSmsNotification,
} = require("../controllers/index.js");

// READ API Information
router.get("/", verifyToken, ApiInfo);

// READ ALL CUSTOMERS
router.get("/customers", verifyStaff, getAllCustomers);

// CREATE NEW CUSTOMER
router.post("/customers", verifyToken, addCustomer);

// READ ONE CUSTOMER | Search - Requires: objectId
router.get("/customers/:customerid", verifyUser, getOneCustomer);

// READ ONE CUSTOMER | Search - Requires: idnumber
router.get("/customers/:idnumber", verifyUser, searchCustomer);

// READ ALL BOOKINGS
router.get("/bookings", verifyUser, getAllBookings);

// READ One BOOKINGS
router.get("/bookings/:bookingid", verifyUser, getOneBooking);

// CREATE NEW BOOKING
router.post("/bookings", verifyToken, addBookings);

// READ ALL INVOICES
router.get("/invoices", verifyUser, getAllBookingInvoice);

// READ ONE INVOICE
router.get("/invoices/:id", verifyUser, getBookingInvoice);

// INITIATE INVOICE PAYMENT
router.post("/mpesa-payment/:bookingid", verifyUser, initiateMpesaPayment);

// INITIATE SMS NOTIFICATIONS - BOOKING INVOICE
router.post("/sms/:bookingid", verifyUser, initiateSmsNotification);

// READ ALL ROOMS
router.get("/rooms", verifyAdmin, fetchAllRooms);

// READ ALL ROOM TYPES AVAILABLE
router.get("/rooms/types", verifyAdmin, allRoomTypes);

// CREATE NEW ROOM TYPE
router.post("/rooms/types", verifyAdmin, createRoomType);

// CREATE ROOM | Requires: roomtypeid
router.post("/rooms/:roomtypeid", verifyAdmin, createRoom);

// READ ONE ROOM INFO | Requires: roomid
router.get("/rooms/:roomid", verifyAdmin, fetchOneRoom);

module.exports = router;
