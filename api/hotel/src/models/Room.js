const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
	{
		number: { type: String, required: true, unique: true },
		isBooked: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

const Room = mongoose.model("Room", RoomSchema);

module.exports = Room;
