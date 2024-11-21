// const bcryptjs = require("bcryptjs");
// const { sign, verify } = require("jsonwebtoken");
// const axios = require("axios");
const { createError } = require("../utils/error");
const { getDatesInRange } = require("../utils/getDateRange");
const { isObjectIdOrHexString } = require("mongoose");
const RabbitMQConfig = require("../config/rabbitmq.config.js");

const Customer = require("../models/Customer.js");
const RoomType = require("../models/RoomType.js");
const Booking = require("../models/Booking.js");
const Invoice = require("../models/Invoice.js");
const Room = require("../models/Room.js");

// Import Hotel Service
const {
  saveCustomer,
  fetchAllCustomers,
  fetchBookings,
  searchCustomer,
  findCustomer,
  findRoom,
  findRoomType,
  saveBookingAndInvoice,
  checkRoomAvailability,
  updateRoomTypeAvailability,
  updateRoomStatus,
  fetchOneRoom,
  fetchAllRooms,
  checkRoomTypeCapacity,
  findBooking,
  fetchInvoices,
} = require("../services/hotel.service");

const { AUTH_API_URL } = require("../config/config.js");

exports.ApiInfo = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Hotel API",
      description: "Hotel API | Version 1",
    });
  } catch (error) {
    next(error);
  }
};

// ________________________________________________
// CUSTOMERS INFORMATION
// ________________________________________________

// Add Customers List View | GET
exports.getAllCustomers = async (req, res, next) => {
  try {
    const customers = await fetchAllCustomers();

    res.status(200).json({
      success: true,
      data: { customers },
    });
  } catch (error) {
    next(error);
  }
};

// Read Single Customer | GET (by objectId)
exports.getOneCustomer = async (req, res, next) => {
  const { customerid } = req.params;

  // Fetching One Customer...
  try {
    if (isObjectIdOrHexString(customerid)) {
      const customer = await Customer.findById(customerid);
      console.log(`> Customer Found: ${customer._id}`);

      res.status(200).json({
        success: true,
        data: { customer },
      });
    }
    return next(createError(500, `Invalid  ID: ${customerid}`));
  } catch (error) {
    console.log(`> Error: ${error.message}`);
    return next(createError(404, `Booking not found!`));
  }
};

// Add Customers | POST
exports.addCustomer = async (req, res, next) => {
  const { firstname, lastname, id_number, phone_number, email } = req.body;

  let errors = {};

  if (!firstname || !lastname || !id_number || !email) {
    errors = { messsage: "Please enter all fields" };

    return res.status(400).json({
      success: false,
      data: errors,
    });
  }

  if (firstname.length < 3) {
    errors = {
      messsage: "Firstname must be at least 3 characters long!",
    };

    return res.status(400).json({
      success: false,
      data: errors,
    });
  }
  if (lastname.length < 3) {
    errors = { messsage: "Lastname must be at least 3 characters long!" };

    return res.status(400).json({
      success: false,
      data: errors,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      data: errors,
    });
  } else {
    // Check if the provided ID number exists in the database
    Customer.findOne({ id_number }).then((idNumberExists) => {
      if (idNumberExists) {
        errors = {
          messsage: `ID number already exists!`,
        };

        return res.status(500).json({
          success: false,
          data: errors,
        });
      } else {
        // Check if the provided email exists in the database
        Customer.findOne({ email }).then((emailExists) => {
          if (emailExists) {
            errors = {
              messsage: `Email already exists!`,
            };

            return res.status(500).json({
              success: false,
              data: errors,
            });
          } else {
            // Create a customer details | Object
            let customerDetails = {
              firstname,
              lastname,
              id_number,
              phone_number,
              email,
            };
            // Save the customer details
            saveCustomer(customerDetails)
              .then((id) => {
                console.log(`> [CREATED] Customer: ${id}`);

                res.status(201).json({
                  success: true,
                  data: {
                    customer: id,
                  },
                });
              })
              .catch((err) => {
                console.log(`> [Controller] error - ${err}`);

                errors = {
                  messsage: `An error occurred while saving!`,
                };

                res.status(500).json({
                  success: false,
                  data: errors,
                });
              });
          }
        });
      }
    });
  }
};

// ________________________________________________
// ADD HOTEL ACCOMODATIONS | INFORMATION
// ________________________________________________

// Room Booking List View | GET ALL
exports.getAllBookings = async (req, res, next) => {
  // Fetching All Bookings Made
  try {
    const bookings = await fetchBookings();

    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    return next(createError(500, `${error.message}`));
  }
};

// Room Bookings | GET SINGLE (By ID)
exports.getOneBooking = async (req, res, next) => {
  const { bookingid } = req.params;

  // Fetching One Booking...
  try {
    if (isObjectIdOrHexString(bookingid)) {
      const booking = await Booking.findById(bookingid)
        .populate("customer")
        .populate("roomType")
        .populate("invoiceRef");
      console.log(`> Booking Found: ${booking._id}`);

      res.status(200).json({
        success: true,
        data: { booking },
      });
    }
    return next(createError(500, `Invalid  ID: ${bookingid}`));
    // const booking = await findBooking(bookingid);
  } catch (error) {
    console.log(`> Error: ${error.message}`);
    return next(createError(404, `Booking not found!`));
  }
};

// Room Booking List View | Search Customer by ID Number in query params | GET
exports.searchCustomer = async (req, res) => {
  let errors = {};
  const { idnumber } = req.params;

  // Search customer with the id
  await searchCustomer(idnumber)
    .then((customerFound) => {
      if (!customerFound) {
        return res.status(500).json({
          success: true,
          data: {
            msg: "No customer found with that ID number",
          },
        });
      }
      console.log(`> Customer ID: ${customerFound._id}`);
      console.log(`> Customer Details: ${customerFound}`);
      // customerID = customerFound._id;
      // req.session.customerID = customerID;

      return res.status(200).json({
        success: true,
        data: { customer: customerFound._doc },
      });
    })
    .catch((err) => {
      console.log(`> [Controller] error - ${err.message}`);

      // req.flash(
      // 	"error_msg",
      // 	`There is no customer with this ID number: ${id_number}...`,
      // );

      // return res.redirect("/admin/bookings/search-customer");

      return res.status(500).json({
        success: false,
        data: err,
      });
    });

  // res.redirect("/admin/bookings/booking-details");
};

// Admin Panel - POST | Bookings Details Page
exports.addBookings = async (req, res, next) => {
  try {
    const {
      customerId,
      numberAdults,
      numberKids,
      roomType,
      checkInDate,
      checkOutDate,
      paymentMethod,
    } = req.body;

    const { access_token } = req;
    let currentUser = {};

    // Change this to gRPC
    const resp = await fetch(`${AUTH_API_URL}/api/v1/user`, {
      method: "get",
      headers: {
        authorization: `Bearer ${access_token}`,
      },
    });
    // const resp = await axios(`${AUTH_API_URL}/api/v1/user`, {
    //   method: "get",
    //   headers: {
    //     authorization: `Bearer ${access_token}`,
    //   },
    // });
    const { success, data } = await resp.json();

    if (!success) {
      return next(createError(500, `User session not found`));
    }
    const { user } = data;
    currentUser = { ...user };
    console.log(`> currentUser: ${currentUser._id}`);
    // console.log("> Authorized user: ", req.user);

    if (
      !customerId ||
      !roomType ||
      !checkInDate ||
      !checkOutDate ||
      !paymentMethod
    ) {
      return next(createError(400, `Please enter all fields`));
    }

    if (
      typeof numberAdults === "string" ||
      typeof numberKids === "string" ||
      parseInt(numberAdults) <= 0 ||
      parseInt(numberKids) < 0
    ) {
      return next(
        createError(400, `Please specify the number of people to accomodate`)
      );
    }

    // Check if checkInDate is invalid
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let dateCheckedIn = new Date(checkInDate).getTime();
    let dateCheckedOut = new Date(checkOutDate).getTime();

    const ischeckInDateOlderThanCurrentDate = dateCheckedIn < today.getTime();
    // console.log({ ischeckInDateOlderThanCurrentDate });

    if (ischeckInDateOlderThanCurrentDate) {
      return next(
        createError(
          400,
          `Please choose the current or a future date to check in`
        )
      );
    }

    // Check if checkOutDate is invalid
    if (dateCheckedIn > dateCheckedOut) {
      return next(createError(400, `Please choose a future date to check out`));
    }

    // Check if the customer exists
    const customer = await Customer.findOne({ id_number: String(customerId) });
    if (!customer) {
      return next(createError(404, `Customer not found`));
    }

    // Check if the room type exists
    const roomTypeDoc = await RoomType.findOne({ roomType });
    const roomTypeDocID = roomTypeDoc._id;
    console.log({ roomTypeDocID });
    if (!roomTypeDoc) {
      return next(createError(404, `Room type not found`));
    }
    console.log({ roomsRoomTypeSelected: roomTypeDoc.rooms });

    // Check if there are available rooms
    // const availableRooms = await Room.find({ isBooked: false });
    // console.log({ availableRooms });
    const allRoomsNotBooked = await Room.find({ isBooked: false });
    console.log({ allRoomsNotBooked });
    // const isRoomTypeAvailable =
    //   roomTypeDoc.reservations.bookingRef.length <= roomTypeDoc.rooms.length;
    const isRoomTypeAvailable = roomTypeDoc.rooms.some((room) =>
      allRoomsNotBooked.some(
        (availableRoom) =>
          availableRoom._id.equals(room) && !availableRoom.isBooked
      )
    );
    console.log({ isRoomTypeAvailable });
    if (!isRoomTypeAvailable) {
      return next(createError(500, `No rooms available`));
    }

    const availableSelectedRooms = roomTypeDoc.rooms
      .map((selectedRoom) =>
        allRoomsNotBooked.find(
          (room) => room._id.equals(selectedRoom) && !room.isBooked
        )
      )
      .filter(Boolean);
    console.log({ availableSelectedRooms });

    // Select a random available room
    // const roomIndex = Math.floor(Math.random() * availableRooms.length);
    const roomIndex = Math.floor(Math.random() * availableSelectedRooms.length);
    console.log({ roomIndex });
    // const room = availableRooms[roomIndex];
    const room = availableSelectedRooms[roomIndex];
    console.log({ randomRoomSelected: room });

    // Find the room type based on the random room chosen
    // const { _id } = await RoomType.findOne({ rooms: room._id });
    // // const roomTypeFound = _id;
    // console.log({ roomTypeFound });

    // Create a new invoice
    const diffinTime = Math.abs(new Date(checkOutDate) - new Date(checkInDate));
    const diffinDays = Math.ceil(diffinTime / (1000 * 60 * 60 * 24));
    console.log({ diffinDays });

    const subTotalCost =
      roomTypeDoc.rate *
      (diffinDays === 0 ? 1 : diffinDays) *
      (numberAdults + numberKids);
    const vat = 0.16 * Number(subTotalCost);
    const totalCost = subTotalCost + vat;

    const invoice = new Invoice({
      status: "pending",
      paymentMethod: paymentMethod,
      subTotalCost: subTotalCost,
      vat: vat,
      totalCost: totalCost,
    });

    // Create a new booking
    const booking = new Booking({
      customer: customer,
      numberAdults: numberAdults,
      numberKids: numberKids,
      roomType: roomTypeDocID,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      invoiceRef: invoice._id,
    });

    invoice.bookingRef = booking._id;

    // Update Room Availability: reservations field in RoomType model
    const alldates = getDatesInRange(checkInDate, checkOutDate);
    const hasUpdatedReservations = await updateRoomTypeAvailability(
      roomTypeDocID,
      alldates,
      booking._id
    );
    // console.log("> UpdatedReservations: ", hasUpdatedReservations);
    if (!hasUpdatedReservations) {
      return next(
        createError(500, `Error occurred while updating room reservations`)
      );
    }

    // Update the random room chosen
    room.isBooked = true;
    await room.save();
    console.log({ room });

    // Save the invoice
    await invoice.save();
    console.log({ invoice });

    // Save the booking
    await booking.save();
    console.log({ booking });

    res.status(201).json({
      message: "Room booked successfully",
      data: { booking: booking, room: room, invoice: invoice },
    });
  } catch (error) {
    console.log({ error });
    return next(createError(500, `${error.message}`));
  }
};

// READ All Invoices | GET
exports.getAllBookingInvoice = async (req, res, next) => {
  // Fetching All Invoices Made
  try {
    const allInvoices = await fetchInvoices();

    res.status(200).json({
      success: true,
      data: { allInvoices },
    });
  } catch (error) {
    return next(createError(500, `${error.message}`));
  }
};

// Admin Panel - GET | Bookings Invoice Page
exports.getBookingInvoice = async (req, res, next) => {
  const { invoiceid } = req.params;

  // Fetching One Invoice...
  try {
    if (isObjectIdOrHexString(invoiceid)) {
      const invoice = await Invoice.findById(invoiceid);
      console.log(`> Invoice found: ${invoice._id}`);

      res.status(200).json({
        success: true,
        data: { invoice },
      });
    }
    return next(createError(500, `Invalid  ID: ${invoiceid}`));
  } catch (error) {
    console.log(`> Error: ${error.message}`);
    return next(createError(404, `Invoice not found!`));
  }
};

exports.initiateMpesaPayment = async (req, res, next) => {
  const { bookingid } = req.params;
  // console.log({ bookingid });

  // Fetching Booking...
  try {
    if (isObjectIdOrHexString(bookingid)) {
      // const booking = await findBooking(bookingid);
      const booking = await Booking.findById(bookingid)
        .populate("customer")
        .populate("roomType")
        .populate("invoiceRef");
      console.log(`> Booking Found: ${booking}`);

      if (booking === null) {
        return next(createError(404, `Booking ${bookingid} not found!`));
      }

      const message = {
        first_name: String(booking.customer.firstname),
        last_name: String(booking.customer.lastname),
        email: String(booking.customer.email),
        host: "https://hotel-elmariam.com",
        amount: Number(booking.invoiceRef.totalCost),
        phone_number: String(booking.customer.phone_number),
        api_ref: `hotel-elmariam-booking-${String(booking._id)}`,
      };

      // Send Message to Queue
      const queue = "mpesa";
      const rabbitMQConfig = new RabbitMQConfig();

      // Open connection
      await rabbitMQConfig.connect();

      // send message to publish
      await rabbitMQConfig.createQueue(queue);
      await rabbitMQConfig.publishToQueue(queue, JSON.stringify(message));

      // Close connection
      await rabbitMQConfig.close();

      // Return response
      res.status(200).json({
        success: true,
        data: { message: "M-pesa payment initiated..." },
      });
      return;
    }
    return next(createError(404, `Booking ${bookingid} not found!`));
  } catch (error) {
    console.log(`> Error: ${error.message}`);
    return next(
      createError(
        500,
        `Error occurred while initiating mpesa payment: ${error.message}`
      )
    );
  }
};

exports.initiateSmsNotification = async (req, res, next) => {
  const { bookingid } = req.params;
  // console.log({ bookingid });

  // Fetching Booking...
  try {
    if (isObjectIdOrHexString(bookingid)) {
      // const booking = await findBooking(bookingid);
      const booking = await Booking.findById(bookingid)
        .populate("customer")
        .populate("roomType")
        .populate("invoiceRef");
      console.log(`> Booking Found: ${booking}`);

      if (booking === null) {
        return next(createError(404, `Booking ${bookingid} not found!`));
      }

      const message = `Greetings ${
        booking.customer.firstname
      }. Your hotel boooking invoice of amount Kes. ${
        booking.invoiceRef.totalCost
      } is due on ${booking.checkOutDate.toLocaleDateString()}`;

      const smsMessage = {
        message,
        phoneNumbers: `0${String(booking.customer.phone_number).slice(3)}`,
      };

      // Send Message to Queue
      const queue = "sms";
      const rabbitMQConfig = new RabbitMQConfig();

      // Open connection
      await rabbitMQConfig.connect();

      // send message to publish
      await rabbitMQConfig.createQueue(queue);
      await rabbitMQConfig.publishToQueue(queue, JSON.stringify(smsMessage));

      // Close connection
      await rabbitMQConfig.close();

      // Return response
      res.status(200).json({
        success: true,
        data: { message: "SMS notification sent..." },
      });
      return;
    }
    return next(createError(404, `Invalid  ID: ${bookingid}`));
  } catch (error) {
    console.log(`> Error: ${error.message}`);
    return next(
      createError(
        500,
        `Error occurred while sending SMS notification: ${error.message}`
      )
    );
  }
};

// ______________________________________
// ADD ROOM INFORMATION
// ______________________________________

// CREATE Room Type Info | POST
exports.createRoomType = async (req, res, next) => {
  const newRoomType = new RoomType(req.body);

  try {
    const createdRoomType = await newRoomType.save();
    res.status(200).json({
      success: true,
      data: createdRoomType,
    });
  } catch (err) {
    next(err);
  }
};

// CREATE Room Info | POST
exports.createRoom = async (req, res, next) => {
  const { roomtypeid } = req.params;
  const newRoom = new Room(req.body);

  try {
    const createdRoomId = newRoom._id;
    // console.log("> createdRoomId: ", createdRoomId);

    const queryRes = await RoomType.updateOne(
      { _id: roomtypeid },
      {
        $push: { rooms: createdRoomId },
      }
    );
    console.log({ matchedSchema: queryRes.matchedCount });

    if (queryRes.matchedCount === 0) {
      return next(createError(500, `Room type: ${roomtypeid} not found!`));
    }

    const createdRoom = await newRoom.save();

    res.status(200).json({
      success: true,
      data: createdRoom,
    });
  } catch (err) {
    console.log("> Error: ", err.message);
    return next(createError(500, "Error creating room"));
  }
};

// Room Info | POST Deprecated
// exports.addRoomInfo = (req, res) => {
// 	const { roomType, roomCapacity, roomNumber, roomRate, booked } = req.body;

// 	let errors = [];
// 	let isBooked;

// 	if (!roomType || !roomCapacity || !roomNumber || !roomRate || !booked) {
// 		errors.push({ msg: "Please enter all fields" });
// 	}

// 	if (errors.length > 0) {
// 		res.render("admin/addRoomInfo", {
// 			errors,
// 			roomType,
// 			roomCapacity,
// 			roomNumber,
// 			roomRate,
// 			booked,
// 			user: req.user,
// 			title: "Add Room Info",
// 			layout: "./layouts/adminLayout",
// 		});
// 	} else {
// 		// Check if the room exists in the database
// 		Room.findOne({ roomNumber: roomNumber }).then((roomNumber) => {
// 			if (roomNumber) {
// 				errors.push({
// 					msg: `A room with that number already exists!`,
// 				});
// 				res.render("admin/addRoomInfo", {
// 					errors,
// 					roomType,
// 					roomCapacity,
// 					roomNumber: req.body.roomNumber,
// 					roomRate,
// 					booked,
// 					user: req.user,
// 					title: "Add Room Info",
// 					layout: "./layouts/adminLayout",
// 				});
// 			} else {
// 				// Initialize room booking to false
// 				if (booked == "false") {
// 					isBooked = false;
// 				} else {
// 					isBooked = true;
// 				}

// 				const newRoom = new Room({
// 					roomType: roomType,
// 					roomCapacity: roomCapacity,
// 					roomNumber: req.body.roomNumber,
// 					roomRate: roomRate,
// 					isBooked: isBooked,
// 				});

// 				newRoom
// 					.save()
// 					.then(() => {
// 						req.flash(
// 							"success_msg",
// 							`Room information was saved successfully!`,
// 						);
// 						res.redirect("/admin/add-room-info");
// 					})
// 					.catch((err) => {
// 						req.flash(
// 							"error_msg",
// 							`An error occurred while saving the room...`,
// 						);
// 						res.redirect("/admin/add-room-info");
// 					});
// 			}
// 		});
// 	}
// };

// READ All Rooms Info | GET
exports.fetchAllRooms = (req, res, next) => {
  let errors = {};

  // Fetching All Bookings Made
  fetchAllRooms()
    .then((rooms) => {
      res.status(200).json({
        success: true,
        data: { rooms },
      });
    })
    .catch((err) => {
      return next(createError(500, `${err.message}`));
    });
};

// READ All Room Types | GET
exports.allRoomTypes = async (req, res, next) => {
  // Fetching All Room Types
  try {
    const roomTypes = await RoomType.find({})
      .populate({ path: "rooms", model: "Room" })
      .populate({
        path: "reservations",
        populate: {
          path: "bookingRef",
          model: "Booking",
        },
      });

    res.status(200).json({
      success: true,
      data: { roomTypes },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE Room Type Info | PUT
exports.updateRoomType = async (req, res, next) => {
  // Fetching All Room Types
  try {
    const roomTypes = await RoomType.find({});

    res.status(200).json({
      success: true,
      data: { roomTypes },
    });
  } catch (error) {
    next(error);
  }
};

// READ One Room Info | GET
exports.fetchOneRoom = async (req, res, next) => {
  const { roomid } = req.params;
  const room = await fetchOneRoom(roomid);

  if (room) {
    res.status(200).json({
      success: true,
      data: { room },
    });
  } else {
    return next(createError(404, "Room not found"));
  }
};

// READ One Room | GET - Using Room Number
exports.searchRoom = async (req, res, next) => {
  // try {
  // 	const rooms = await Room.find({roomNumbers.number});
  // 	res.status(200).json(rooms);
  // } catch (err) {
  // 	next(err);
  // }
};
