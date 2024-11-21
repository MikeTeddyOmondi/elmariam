const mongoose = require("mongoose");

const RoomTypeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    roomType: {
      type: String,
      enum: ["single", "double"],
      unique: true,
      required: true,
    },
    rooms: {
      type: [mongoose.Schema.Types.ObjectId],
    },
    reservations: {
      bookingRef: {
        type: [mongoose.Schema.Types.ObjectId],
      },
      unavailableDates: {
        type: [Date],
      },
    },
  },
  { timestamps: true }
);

RoomTypeSchema.virtual("room", {
  ref: "Room",
  localField: "rooms",
  foreignField: "_id",
  justOne: false,
});

RoomTypeSchema.virtual("booking", {
  ref: "Booking",
  localField: "reservations.bookingRef",
  foreignField: "_id",
  justOne: true,
});

const RoomType = mongoose.model("RoomType", RoomTypeSchema);

module.exports = RoomType;
