const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
    },
    status: {
      type: String,
      enum: ["paid", "pending"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "bank"],
      required: true,
    },
    vat: {
      type: Number,
      required: true,
    },
    subTotalCost: {
      type: Number,
      required: true,
    },
    totalCost: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

InvoiceSchema.virtual("booking", {
  ref: "Booking",
  localField: "bookingRef",
  foreignField: "_id",
  justOne: true,
});

const Invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = Invoice;
