const jwt = require("jsonwebtoken");
const { createError } = require("../utils/error.js");

const { ACCESS_SECRET } = require("../config/config.js");

const verifyToken = (req, res, next) => {
  const reqHeaders = req.headers["authorization"];

  if (!reqHeaders) {
    return next(createError(401, "Unauthenticated request"));
  }

  const token = reqHeaders.split(" ")[1];
  if (!token) {
    return next(createError(401, "Unauthenticated request"));
  }

  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return next(createError(403, "Invalid token"));
    req.user = user;
    req.access_token = token;
    next();
  });
};

const verifyUser = (req, res, next) => {
  const reqHeaders = req.headers["authorization"];

  if (!reqHeaders) {
    return next(createError(401, "Unauthenticated request"));
  }

  const token = reqHeaders.split(" ")[1];
  if (!token) {
    return next(createError(401, "Unauthenticated request"));
  }

  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return next(createError(401, "Invalid token"));

    if (user.id === req.params.id || user.isAdmin) {
      next();
    } else {
      return next(createError(403, "Unauthorized request"));
    }
  });
};

const verifyStaff = (req, res, next) => {
  const reqHeaders = req.headers["authorization"];

  if (!reqHeaders) {
    return next(createError(401, "Unauthenticated request"));
  }

  const token = reqHeaders.split(" ")[1];
  if (!token) {
    return next(createError(401, "Unauthenticated request"));
  }

  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return next(createError(401, "Invalid token"));

    if (user.userType === "staff" || user.isAdmin) {
      next();
    } else {
      return next(createError(403, "Unauthorized request"));
    }
  });
};

const verifyAdmin = (req, res, next) => {
  const reqHeaders = req.headers["authorization"];

  if (!reqHeaders) {
    return next(createError(401, "Unauthenticated request"));
  }

  const token = reqHeaders.split(" ")[1];
  if (!token) {
    return next(createError(401, "Unauthenticated request"));
  }

  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return next(createError(401, "Invalid token"));

    // console.log({ user });

    if (user.userType === "management" || user.isAdmin) {
      req.user = user;
      req.access_token = token;
      next();
    } else {
      return next(createError(403, "Unauthorized request"));
    }
  });
};

module.exports = {
  verifyToken,
  verifyUser,
  verifyStaff,
  verifyAdmin,
};
