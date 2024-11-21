require("dotenv").config({
  path: "./src/.env",
  debug: process.env.NODE_ENV === "development" ? true : false,
});

const {
  REFRESH_SECRET,
  ACCESS_SECRET,
  DB_URL,
  AUTH_API_URL,
  PORT,
  NODE_ENV,
} = process.env;

module.exports = {
  REFRESH_SECRET,
  ACCESS_SECRET,
  AUTH_API_URL,
  DB_URL,
  PORT,
  NODE_ENV,
};
