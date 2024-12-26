const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Load User model
const BarPurchase = require("../models/BarPurchase");
const BarSale = require("../models/BarSale");
const Drink = require("../models/Drink");

// Utils
const { createError } = require("../utils/error");
const { S3_HOSTNAME } = require("../config/config.js");

// Import Bar Service
const {
  saveDrink,
  searchDrink,
  findDrink,
  fetchAllDrinks,
  saveBarPurchase,
  findBarPurchase,
  fetchBarPurchases,
  updateStockQuantity,
  fetchAllBarSales,
  fetchBarSale,
} = require("../services/bar.service");

const BUCKET_NAME = String("hotel-elmiriam");

exports.apiInfo = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bar API",
    description: "Bar API | Version 1",
  });
};

// ______________________________________
// ADD BAR DRINKS INFORMATION
// ______________________________________

// Bar Drink | Menu Updates | GET (ALL)
exports.getBarDrinks = async (req, res, next) => {
  try {
    const drinks = await fetchAllDrinks();
    res.status(200).json({
      success: true,
      data: { drinks },
    });
  } catch (error) {
    return next(createError(500, "Error fetching drinks"));
  }
};

// Bar Drink | Menu Updates | GET (ONE)
exports.getOneBarDrink = async (req, res, next) => {
  const objectID = req.params.id;
  try {
    const drink = await findDrink(objectID);
    res.status(200).json({
      success: true,
      data: { drink },
    });
  } catch (error) {
    return next(createError(500, "Error fetching the drink"));
  }
};

// Bar Drink | Menu Updates | POST
exports.addBarDrinks = async (req, res, next) => {
  // const bodyData = JSON.parse(req.body);
  const bodyData = req.body;
  const {
    drinkName,
    drinkCode,
    typeOfDrink,
    uom,
    packageQty,
    buyingPrice,
    sellingPrice,
  } = bodyData;

  const { mimetype, originalname, path } = req.file ?? {};
  // console.log({ mimetype, originalname, path });

  let errors = {};

  if (
    !drinkName ||
    !drinkCode ||
    !typeOfDrink ||
    !uom ||
    !packageQty ||
    !buyingPrice ||
    !sellingPrice
  ) {
    errors = { message: "Please enter all fields" };

    return res.status(400).json({
      success: false,
      data: errors,
    });
  }

  if (!mimetype || mimetype.split("/")[0] !== "image") {
    errors = { message: "Only images are allowed" };

    return res.status(400).json({
      success: false,
      data: errors,
    });
  }

  // if (size > 10485760) {
  //   errors = { message: "Image must be less than 10MB" };
  //   return res.status(400).json({
  //     success: false,
  //     data: errors,
  //   });
  // }

  if (
    typeOfDrink !== "spirit" &&
    typeOfDrink !== "beer" &&
    typeOfDrink !== "rtd" &&
    typeOfDrink !== "wine" &&
    typeOfDrink !== "water"
  ) {
    errors = {
      message: "Types of drinks accepted: spirit, beer, rtd, wine or water",
    };
    return res.status(400).json({
      success: false,
      data: errors,
    });
  }

  if (uom !== "bottles" && uom !== "crates" && uom !== "pack") {
    errors = {
      message: "Units of measurement(uom) accepted: bottles, crates or pack",
    };
    return res.status(400).json({
      success: false,
      data: errors,
    });
  }

  // Check if the drink code exists in the database
  const drinkFound = await searchDrink(drinkCode);
  console.log("> Searched drink: ", drinkFound);

  if (drinkFound !== null) {
    errors = { message: `Drink code already exists!` };
    return res.status(500).json({
      success: false,
      data: errors,
    });
  }

  let imageUrl = "";

  if (S3_HOSTNAME == undefined) {
    return next(createError(500, `[#] Minio configuration required!`));
  } else {
    imageUrl = `https://${S3_HOSTNAME}/${BUCKET_NAME}/${path}`;
  }

  if (imageUrl.includes(undefined) || imageUrl === "") {
    return next(
      createError(
        500,
        `Error saving drink information: imageUrl is incorrect! ${imageUrl}`
      )
    );
  }

  let calculatedBuyingPrice = 0;
  let calculatedSellingPrice = 0;

  if (uom === "crates" || uom === "pack") {
    calculatedBuyingPrice = buyingPrice / packageQty;
    calculatedSellingPrice = sellingPrice / packageQty;
  } else {
    calculatedBuyingPrice = buyingPrice;
    calculatedSellingPrice = sellingPrice;
  }

  const newDrink = {
    drinkName,
    drinkCode,
    typeOfDrink,
    uom,
    packageQty,
    buyingPrice: calculatedBuyingPrice,
    sellingPrice: calculatedSellingPrice,
    buyingStockPrice: buyingPrice,
    sellingStockPrice: sellingPrice,
    imageUrl,
  };
  console.log({ newDrink });

  await saveDrink(newDrink)
    .then((doc) => {
      res.status(201).json({
        success: true,
        data: {
          message: `Drink: ${doc.drinkCode} created successfully!`,
        },
      });
    })
    .catch((err) => {
      console.log({ err });
      return next(
        createError(500, `Error saving drink information: ${err.message}`)
      );
    });
};

// ______________________________________
// ADD BAR PURCHASES INFORMATION
// ______________________________________

// Bar purchases | GET
exports.getBarPurchases = async (req, res, next) => {
  try {
    // Fetching All Bar Purchases
    const purchases = await fetchBarPurchases();
    res.status(200).json({
      success: true,
      data: { purchases },
    });
  } catch (err) {
    return next(createError(500, "Error fetching bar purchases"));
  }
};

// Bar purchases | GET
exports.getOneBarPurchase = async (req, res, next) => {
  const objectID = req.params.id;
  try {
    const barPurchase = await findBarPurchase(objectID);

    // TODO: check null
    if (Object.fromEntries(barPurchase).length === 0) {
      return next(createError(400, `Bar purchase: ${objectID} not found!`));
    }

    res.status(200).json({
      success: true,
      data: { barPurchase },
    });
  } catch (error) {
    console.log({ error });
    return next(createError(500, "Error fetching the bar purchase"));
  }
};

// Bar purchases | POST
exports.postBarPurchases = async (req, res, next) => {
  try {
    const { receiptNumber, product, quantity, supplier } = req.body;

    let errors = {};

    if (!receiptNumber || !product || !quantity || !supplier) {
      errors = { message: "Please enter all fields" };
      return next(createError(400, `Please enter all fields!`));
    }

    // console.log({ receiptNumber, product, quantity, supplier });

    // Confirm the product exists
    const productInfo = await findDrink(product);

    if (String(productInfo._id) !== product) {
      return next(createError(404, `Product: ${product} was not found!`));
    }

    let stockValue = 0;

    // Calculate Stock value
    if (productInfo.uom === "bottles") {
      stockValue = productInfo.buyingStockPrice * Number(quantity);
    } else if (productInfo.uom === "crates") {
      stockValue = productInfo.buyingStockPrice * (Number(quantity) / 24);
    }

    // Save the purchase & update stock quantity
    const newBarPurchase = {
      receiptNumber,
      product: productInfo._id,
      quantity: Number(quantity),
      stockValue,
      supplier,
    };

    await saveBarPurchase(newBarPurchase)
      .then(async (savedBarPurchase) => {
        // console.log({ savedBarPurchase });
        console.log(`[#] New Bar Purchase: ${savedBarPurchase._id}`);

        await updateStockQuantity(productInfo, quantity)
          .then(() => {
            console.log(
              `[#] Updated stock quantity of product: ${productInfo._id} successfully!`
            );

            res.status(201).json({
              success: true,
              data: {
                message: `Bar Purchase: ${savedBarPurchase._id} created successfully!`,
              },
            });
          })
          .catch((err) => {
            throw new Error(
              `Error creating the new bar purchase: ${err.message}`
            );
          });
      })
      .catch((err) => {
        throw new Error(`Error creating the new bar purchase: ${err.message}`);
      });
  } catch (err) {
    console.log(`[!] Error creating the new bar purchase: ${err}`);
    return next(
      createError(500, `Error creating the new bar purchase: ${err.message}`)
    );
  }
};

// ______________________________________
// ADD BAR SALES INFORMATION
// ______________________________________

exports.getBarSales = async (req, res, next) => {
  try {
    const sales = await fetchAllBarSales();
    console.log({ sales });
    return res.status(200).json({
      success: true,
      data: { sales },
    });
  } catch (error) {
    console.log({ error });
    return next(createError(500, "Error fetching drinks"));
  }
};

exports.getOneBarSale = async (req, res, next) => {
  const objectID = req.params.id;
  try {
    const sale = await fetchBarSale(objectID);
    console.log({ sale });
    return res.status(200).json({
      success: true,
      data: { sale },
    });
  } catch (error) {
    return next(createError(500, "Error fetching the bar sale"));
  }
};

exports.postBarSales = async (req, res, next) => {
  let { checkoutDrinkItems } = req.body;
  console.log({ checkoutDrinkItems });

  async function getDrinkDetails() {
    let barItems = await Promise.all(
      checkoutDrinkItems.map(async (item) => {
        const barItem = await findDrink(item.drinkId);
        return barItem;
      })
    );
    return barItems;
  }

  async function calculateBarBill() {
    let barSaleDetails = { drinks: [] };
    const barItems = await getDrinkDetails();
    // console.log({ barItems });

    // Calculate the total checkout price and check stock availability
    let totalCheckoutPrice = 0;
    let stockIssues = [];

    for (const checkoutItem of checkoutDrinkItems) {
      const drinkFound = barItems.find(
        (drinkItem) => drinkItem._id.toString() === checkoutItem.drinkId
      );

      if (drinkFound) {
        if (drinkFound.stockQty >= checkoutItem.quantity) {
          totalCheckoutPrice += drinkFound.sellingPrice * checkoutItem.quantity;
        } else {
          // If stock is insufficient, record the issue
          stockIssues.push({
            drinkId: checkoutItem.drinkId,
            requestedQty: checkoutItem.quantity,
            availableQty: drinkFound.stockQty,
          });
        }

        barSaleDetails.drinks.push({
          productID: mongoose.Types.ObjectId(drinkFound._id),
          qtyBought: checkoutItem.quantity,
          stockValue:
            Number(drinkFound.sellingPrice) * Number(checkoutItem.quantity),
        });
      } else {
        // Handle case where drink is not found
        console.warn("Drink not found for ID:", checkoutItem.drinkId);
        return next(
          createError(404, `Drink not found for ID ${checkoutItem.drinkId}`)
        );
      }
    }

    if (stockIssues.length > 0) {
      return {
        totalCheckoutPrice: 0,
        stockIssues,
      };
    }

    return {
      totalCheckoutPrice,
      barSaleDetails,
      stockIssues: [],
    };
  }

  try {
    const { totalCheckoutPrice, barSaleDetails, stockIssues } =
      await calculateBarBill();

    if (stockIssues.length > 0) {
      console.log("Stock issues found:", stockIssues);
      // Send a response indicating stock issues
      // return res.status(500).json({
      //   success: false,
      //   message: "Out of stock or insufficient stock!",
      //   data: { stockIssues },
      // });
      return next(createError(500, "Out of stock or insufficient stock!"));
    }

    async function updateDrinkStockQty(drinkId, quantity) {
      // Update the stock quantity for the drink in the database
      const res = await Drink.updateOne(
        { _id: drinkId },
        { $inc: { stockQty: -quantity } }
      );

      console.log(`MatchCount ${res.matchedCount}`); // Number of documents matched
      console.log(`Modified Count ${res.modifiedCount}`); // Number of documents modified
      console.log(`Acknowledged ${res.acknowledged}`); // Boolean indicating everything went smoothly.
      console.log(`UpsertedId ${res.upsertedId}`); // null or an id containing a document that had to be upserted.
      console.log(`Upserted Count ${res.upsertedCount}`); // Number indicating how many documents had to be upserted. Will either be 0 or 1.
    }

    // Proceed the bar sale in order to initiate checkout
    console.log({ totalCheckoutPrice });
    // Update stock quantities in the database and proceed with payment
    async function updateStockQuantities(checkoutItems) {
      for (const item of checkoutItems) {
        await updateDrinkStockQty(item.drinkId, item.quantity);
      }
    }

    console.log(`barSaleDetails: ${JSON.stringify(barSaleDetails)}`);
    // create and save the bar sale
    const barSale = new BarSale();
    barSale.drinks.push(...barSaleDetails.drinks);
    barSale.totalStockValue = totalCheckoutPrice;
    console.log(`barSale: ${barSale}`);

    // save & update stock quantities
    await Promise.all([
      barSale.save(),
      updateStockQuantities(checkoutDrinkItems),
    ]);

    return res.status(201).json({
      success: true,
      data: {
        message:
          "Bar sale created successfully. You can now initiate a checkout",
        totalStockValue: barSale.totalStockValue,
        salesId: barSale._id,
      },
    });
  } catch (err) {
    console.error({ barSaleError: err });
    return next(
      createError(500, "An error occurred during creating the bar sale!")
    );
  }
};

// Lipa na Mpesa
exports.lipaNaMpesa = async (req, res, next) => {
  const salesId = req.params.id;
  console.log({ salesId });
};
