const mongoose = require("mongoose");

const DrinkSchema = new mongoose.Schema(
  {
    drinkName: {
      type: String,
      required: true,
    },
    drinkCode: {
      type: String,
      unique: true,
      required: true,
    },
    typeOfDrink: {
      type: String,
      enum: ["spirit", "beer", "rtd", "wine", "water"],
      required: true,
    },
    uom: {
      type: String,
      enum: ["bottles", "crates", "pack"],
      required: true,
    },
    packageQty: {
      type: Number,
      required: true,
    },
    buyingPrice: {
      type: Number,
      required: false,
      default: 0,
      // default: function () {
      //   return this.stockQty !== 0
      //     ? Number(this.buyingStockPrice) / Number(this.packageQty)
      //     : 0;
      // },
    },
    buyingStockPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: false,
      default: 0,
      // default: function () {
      //   return this.stockQty !== 0
      //     ? Number(this.sellingStockPrice) / Number(this.packageQty)
      //     : 0;
      // },
    },
    sellingStockPrice: {
      type: Number,
      required: true,
    },
    stockQty: {
      type: Number,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// function updateBuyingPrice() {
//   return this.stockQty !== 0
//     ? (this.buyingStockPrice =
//         Number(this.buyingStockPrice) / Number(this.packageQty))
//     : 0;
// }

// function updateSellingPrice() {
//   return this.stockQty !== 0
//     ? (this.sellingStockPrice =
//         Number(this.sellingStockPrice) / Number(this.packageQty))
//     : 0;
// }

// DrinkSchema.pre("save", function (next) {
//   // Logic
//   updateBuyingPrice();
//   updateSellingPrice();
//   next();
// });

const Drink = mongoose.model("Drink", DrinkSchema);

module.exports = Drink;
