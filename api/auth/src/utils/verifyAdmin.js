const jwt = require("jsonwebtoken");
const { createError } = require("../utils/error.js");

const { ACCESS_SECRET } = require("../config/config.js");

// Verify Admin (Token)
const verifyAdmin = (req, res, next) => {
  const reqHeaders = req.headers["authorization"];

  if (!reqHeaders) {
    return next(createError(401, "Unauthenticated request"));
  }

  const accessToken = reqHeaders.split(" ")[1];

  if (!accessToken) {
    return next(createError(401, "Unauthenticated request"));
  }

  jwt.verify(accessToken, ACCESS_SECRET, (err, user) => {
    if (err) return next(createError(401, "Invalid token"));

    if (user.userType === "management") {
      // req.user = user;
      // req.access_token = token;
      next();
    } else {
      return next(createError(401, "Unauthorized request"));
    }
  });
};

module.exports = {
  verifyAdmin,
};
