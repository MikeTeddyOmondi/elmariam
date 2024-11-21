// Lib imports
const { DateTime } = require("luxon");

// Utils
const { createError } = require("../utils/error");

// Models
const Customer = require("../models/Customer");
const Booking = require("../models/Booking");
const Invoice = require("../models/Invoice");
const Room = require("../models/Room");
const RoomType = require("../models/RoomType");
const { isObjectIdOrHexString } = require("mongoose");

// Booking Logic | Customer
module.exports = {
  saveCustomer: async (customer) => {
    // Logic here
    const { firstname, lastname, email, id_number, phone_number } = customer;

    let newCustomer = new Customer({
      firstname,
      lastname,
      email,
      id_number,
      phone_number,
    });

    await newCustomer
      .save()
      .then(() => {
        console.log("> Saved a new customer!");
      })
      .catch((err) => {
        console.log("> [Booking Service] error - ", err.message);
        return err;
      });
    return newCustomer._id;
  },
  fetchAllCustomers: async () => {
    // Logic here
    let customers;

    await Customer.find({})
      .then((allCustomers) => {
        // All Customers
        customers = allCustomers;
      })
      .catch((err) => {
        console.log(
          `> [Booking Service] An error occurred while fetching data - ${err.message}`
        );
        return err;
      });

    return customers;
  },
  searchCustomer: async (customerID) => {
    // Searching for customer given the ID number
    let customer;

    await Customer.findOne({ id_number: String(customerID) })
      .then((customerFound) => {
        console.log(`> CustomerFound: ${customerFound._id}`);
        customer = customerFound;
      })
      .catch((err) => {
        console.log(`> [Booking Service (CUSTOMER NOT FOUND ERROR)] - ${err}`);
        customer = null;
        // return err;
        return;
      });
    return customer;
  },
  findCustomer: async (objectID) => {
    // Searching for customer given the unique Object ID
    try {
      const customerFound = await Customer.findById(objectID);
      console.log(`> Customer Found: ${customerFound._id}`);
      return customerFound;
    } catch (err) {
      console.log(`> [Booking Service] error - ${err.message}`);
      return err;
    }
  },
  fetchAllRooms: async () => {
    let rooms;

    await Room.find({})
      .then((allRooms) => {
        // All Rooms
        rooms = allRooms;
      })
      .catch((err) => {
        console.log(
          `> [Booking Service] An error occurred while fetching data - ${err.message}`
        );
        return err;
      });

    return rooms;
  },
  // fetchOneRoom: async (id) => {
  // 	try {
  // 		let room = await Room.findById(id);
  // 		if (room !== null) {
  // 			room = room;
  // 		}
  // 	} catch (err) {
  // 		console.log(err);
  // 		return createError(500, `No room found with that _id`);
  // 	}
  // },
  findRoom: async (roomNumber) => {
    // Logic here
    let roomFound;

    await Room.findOne({ roomNumber })
      .then((room) => {
        // console.log(`> Room Found: ${room._id}`);
        roomFound = room;
      })
      .catch((err) => {
        console.log(`> [Booking Service] error - ${err.message}`);
        return err;
      });

    return roomFound;
  },
  findRoomType: async (roomType) => {
    // Logic here
    let data;

    try {
      const roomTypeFound = await RoomType.findOne({ roomType });
      data = roomTypeFound;
    } catch (err) {
      console.log(`> [Booking Service] error - ${err.message}`);
      return err;
    }

    return data;
  },
  checkRoomTypeCapacity: async (roomType) => {
    let capacity = 0;

    try {
      let room = await RoomType.findById(roomType.id);
      capacity = room.capacity;
      return capacity;
    } catch (error) {
      return err;
    }
  },
  saveBookingAndInvoice: async (booking, roomRate, customerID) => {
    // Booking Service Logic
    const {
      customerId,
      numberAdults,
      numberKids,
      roomType,
      check_in_date,
      check_out_date,
    } = booking;

    // Total number of occupants
    const numberOccupants = parseInt(numberAdults) + parseInt(numberKids);

    // Calculate the number of days to stay in the room
    const days = DateTime.fromISO(check_out_date)
      .diff(DateTime.fromISO(check_in_date), "days")
      .toObject().days;

    console.log(`Accomodation Duration = ${days} day(s)`);

    // Initialized Variables
    const vatPercentage = 16 / 100;
    const subTotal = numberOccupants * parseInt(roomRate) * days;
    const VAT = vatPercentage * subTotal;
    const total = subTotal + VAT;

    let newBooking = new Booking({
      customer: customerId,
      numberAdults,
      numberKids,
      roomType,
      checkInDate: check_in_date,
      checkOutDate: check_out_date,
    });

    // Save Booking
    const savedBooking = await newBooking.save();
    console.log("> newBooking: ", savedBooking);

    // Save Invoice
    const invoice = new Invoice({
      customer: customerID,
      bookingRef: savedBooking._id,
      vat: VAT,
      subTotalCost: subTotal,
      totalCost: total,
    });

    const newInvoice = await invoice.save();
    console.log("> newInvoice: ", newInvoice);

    return { newBooking, newInvoice };
  },
  fetchBookings: async () => {
    // Logic here
    let allBookings = {};

    await Booking.find({})
      .populate("customer")
      .populate("roomType")
      .populate("invoiceRef")
      .then((bookingsMade) => {
        // console.log(`Bookings made: ${bookingsMade}`);
        allBookings = bookingsMade;
        return allBookings;
      })
      .catch((err) => {
        console.log(
          `> [Booking Service] An error occurred while fetching data - ${err.message}`
        );
        allBookings = {};
        return err;
      });

    return allBookings;
  },
  findBooking: async (objectID) => {
    // Fetch booking given the unique Object ID
    try {
      if (isObjectIdOrHexString(objectID)) {
        const bookingFound = await Booking.findById(objectID);
        console.log(`> Booking Found: ${bookingFound._id}`);
        return bookingFound;
      }
      throw new Error(`Booking not found: ${objectID}`);
    } catch (err) {
      console.log(`> [Booking Service] error - ${err.message}`);
      return err;
    }
  },
  updateRoomStatus: async (roomNumber, boolean) => {
    if (boolean == true) {
      await Room.findOneAndUpdate(
        { roomNumber },
        { isBooked: true },
        (err, doc, res) => {
          if (err) return console.log(err.message);
          console.log({ doc });
        }
      ).clone();
    } else if (boolean == false) {
      await Room.findOneAndUpdate(
        { roomNumber },
        { isBooked: false },
        (err, doc, res) => {
          if (err) return console.log(err.message);
          console.log({ doc });
        }
      ).clone();
    } else {
      return console.log(
        "> [Service error} No args provided: (roomNumber, boolean)"
      );
    }

    return;
  },
  // checkRoomAvailability: async (roomFound, requestedDates) => {
  // 	let availability;

  // 	const isAvailable = (room) => {
  // 		const isFound = room.roomNumbers.unavailableDates.some((date) =>
  // 			requestedDates.includes(new Date(date).getTime()),
  // 		);

  // 		return !isFound;
  // 	};

  // 	return (availability = isAvailable(roomFound));
  // },
  updateRoomTypeAvailability: async (roomID, dates, bookingID) => {
    // roomID => req.params.id
    let updated = false;
    console.log({ roomID, dates, bookingID });

    try {
      try {
        console.log("Updating booking ref...");
        await RoomType.updateOne(
          { _id: roomID },
          {
            $push: { "reservations.bookingRef": bookingID },
          }
        );
      } catch (error) {
        console.log(
          "> UpdateRoomTypeAvailability:bookingRef [ERROR]: ",
          error.message
        );
        throw error;
      }

      try {
        console.log("Updating unavailable dates...");
        await RoomType.updateOne(
          { _id: roomID },
          {
            $push: { "reservations.unavailableDates": dates },
          }
        );
      } catch (error) {
        console.log(
          "> UpdateRoomTypeAvailability:unavailableDates [ERROR]: ",
          error.message
        );
        throw error;
      }

      return (updated = true);
    } catch (err) {
      console.log(err);
      return (updated = false);
    }
  },
  fetchInvoices: async () => {
    // Logic here
    let allInvoices = {};

    await Invoice.find({})
      .populate("bookingRef")
      .then((invoices) => {
        // console.log(`Invoices: ${invoices}`);
        allInvoices = invoices;
        return allInvoices;
      })
      .catch((err) => {
        console.log(
          `> [Booking Service] An error occurred while fetching data - ${err.message}`
        );
        allInvoices = {};
        return err;
      });

    return allInvoices;
  },
};
