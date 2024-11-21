const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
		},
		firstname: {
			type: String,
			required: false,
			default: "",
		},
		lastname: {
			type: String,
			required: false,
			default: "",
		},
		email: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		id_number: {
			type: String,
			required: true,
			unique: true,
		},
		phone_number: {
			type: Number,
			required: false,
		},
		userType: {
			type: String,
			enum: ["customer", "staff", "management"],
			required: true,
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: false,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		resetLink: {
			type: String,
			default: "",
		},
	},
	{ timestamps: true },
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
