const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const router = require("./routes/routes.js");
const cookieParser = require("cookie-parser");

const { DB_URL, PORT, NODE_ENV } = require("./config/config.js");
const { verifyToken } = require("./utils/verifyToken");

mongoose.set("strictQuery", false);
mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // authSource: "admin",
  })
  .then(() => {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());
    app.use(
      cors({
        origin: [
          "http://localhost:3000",
          "http://localhost:5000",
          "http://localhost:8080",
        ],
        credentials: true,
      }),
    );

    // Logs
    NODE_ENV === "production"
      ? app.use(morgan("common"))
      : app.use(morgan("dev"));

    // routes(app);

    // API routes
    app.use("/api/v1", router);

    // API Info
    app.use("/api", verifyToken, (req, res) => {
      res.status(200).json({
        success: true,
        message: "Hotel API",
        description: "Hotel API | Version 1",
      });
    });

    // 404 route
    app.use("*", verifyToken, (req, res) => {
      res.status(404).json({
        success: false,
        message: "Resource Not Found",
      });
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
      console.log(`> Hotel service running: http://0.0.0.0:${PORT}`);
    });
  });
