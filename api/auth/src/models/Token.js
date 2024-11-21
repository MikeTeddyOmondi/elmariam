const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		token: {
			type: String,
			required: true,
		},
		created_at: {
			type: Date,
			default: Date.now(),
		},
		expired_at: {
			type: Date,
			default: "",
		},
	},
	{ timestamps: true },
);

TokenSchema.virtual("user", {
	ref: "User",
	localField: "user_id",
	foreignField: "_id",
	justOne: true,
});

const Token = mongoose.model("Token", TokenSchema);

module.exports = Token;
