const mongoose = require("mongoose");

const BarSaleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    drinks: [
      {
        _id: false,
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Drink",
        },
        qtyBought: {
          type: Number,
          required: true,
        },
        stockValue: {
          type: Number,
          required: true,
        },
      },
    ],
    totalStockValue: {
      type: Number,
      default: function () {
        return this.drinks.reduce(function (prev, cur) {
          return prev + cur.stockValue;
        }, 0);
      },
    },
  },
  { timestamps: true }
);

BarSaleSchema.virtual("drinksBought", {
  ref: "Drink",
  localField: "drinks.productID",
  foreignField: "_id",
  justOne: true,
});

const BarSale = mongoose.model("BarSale", BarSaleSchema);

module.exports = BarSale;
