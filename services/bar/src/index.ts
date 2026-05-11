import express from "express";
import { connectDB } from "@elmariam/db";
import router from "./routes/routes";

const PORT = process.env.PORT || 8004;
const DB_URL = process.env.DB_URL || "mongodb://mongo:27017/bar";

const app = express();
app.use(express.json());

// No CORS — KrakenD handles it at the gateway level
app.use("/api/v1", router);

connectDB({ url: DB_URL }).then(() => {
  app.listen(PORT, () => {
    console.log(`> Bar service running on port ${PORT}`);
  });
});
