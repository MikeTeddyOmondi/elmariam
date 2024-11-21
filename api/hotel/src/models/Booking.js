const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    numberAdults: {
      type: Number,
      required: true,
    },
    numberKids: {
      type: Number,
      required: true,
    },
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "RoomType",
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    invoiceRef: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Invoice",
    },
  },
  { timestamps: true }
);

BookingSchema.virtual("occupant", {
  ref: "Customer",
  localField: "customer",
  foreignField: "_id",
  justOne: true,
});

BookingSchema.virtual("room-type", {
  ref: "RoomType",
  localField: "roomType",
  foreignField: "_id",
  justOne: true,
});

BookingSchema.virtual("invoice", {
  ref: "Invoice",
  localField: "invoiceRef",
  foreignField: "_id",
  justOne: true,
});

// BookingSchema.virtual("rooms-booked", {
// 	ref: "Room",
// 	localField: "roomsBooked",
// 	foreignField: "_id",
// 	justOne: true,
// });

// BookingSchema.post("save", async function (doc, next) {
//   await doc.populate({ path: "invoiceRef" }).execPopulate();
//   await doc.populate("invoiceRef").execPopulate();
//   next();
// });

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
