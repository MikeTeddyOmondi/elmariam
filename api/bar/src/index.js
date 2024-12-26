const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const router = require("./routes/routes.js");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const { DB_URL, PORT, NODE_ENV } = require("./config/config.js");
const { verifyStaff } = require("./utils/verifyToken");
const { createError } = require("./utils/error.js");

mongoose.set("strictQuery", true);

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // authSource: "admin",
  })
  .then(() => {
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json({}));
    app.use(cookieParser());
    app.use(
      cors({
        origin: [
          "http://localhost:3000",
          "http://localhost:5000",
          "http://localhost:8080",
        ],
        credentials: true,
      })
    );

    // Logs
    NODE_ENV === "production"
      ? app.use(morgan("common"))
      : app.use(morgan("dev"));

    // routes(app);
    app.get("/", verifyStaff, (req, res) => {
      res.status(200).json({
        success: true,
        message: "Bar API",
        description: "Bar API | Version 1",
      });
    });

    app.use("/api/v1", router);

    // 404 route
    app.get("*", verifyStaff, (req, res) => {
      return createError(404, "Resource Not Found");
    });

    // Error Middleware
    app.use((err, req, res, next) => {
      const errorStatus = err.status || 500;
      const errorMessage = err.message || "Something went wrong!";
      return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        data: {
          message: errorMessage,
        },
        stack: process.env.NODE_ENV === "production" ? {} : err.stack,
      });
    });

    app.listen(PORT, () => {
      console.log(`> Bar service running: http://localhost:${PORT}`);
    });
  });
