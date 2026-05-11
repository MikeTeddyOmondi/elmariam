import express from "express";
import { connectDB } from "@elmariam/db";
import router from "./routes/routes";

const PORT = process.env.PORT || 8003;
const DB_URL = process.env.DB_URL || "mongodb://mongo:27017/hotel";

const app = express();
app.use(express.json());

// No CORS — KrakenD handles it at the gateway level
app.use("/api/v1", router);

connectDB({ url: DB_URL }).then(() => {
  app.listen(PORT, () => {
    console.log(`> Hotel service running on port ${PORT}`);
  });
});
