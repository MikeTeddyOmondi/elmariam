const path = require("path");
const { config } = require("dotenv");

config({
  path: path.join(__dirname, "..", "..", ".env"),
  debug: process.env.NODE_ENV === "development" ? true : false,
});

const PORT = process.env.PORT || 33000;
const RFR_TKN = process.env.G_RFR_TKN;
const ACC_TKN = process.env.G_ACC_TKN;
const CLIENT_ID = process.env.CLIENT_ID;
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const EMAIL_SENDER = process.env.EMAIL_SENDER;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const NODE_ENV = process.env.NODE_ENV || "development";

module.exports = {
  PORT,
  NODE_ENV,
  RABBITMQ_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  EMAIL_SENDER,
  RFR_TKN,
  ACC_TKN,
};
