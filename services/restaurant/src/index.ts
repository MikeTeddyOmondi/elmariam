import express from "express";
import { connectDB } from "@elmariam/db";
import router from "./routes/routes";

const PORT = process.env.PORT || 8005;
const DB_URL = process.env.DB_URL || "mongodb://mongo:27017/restaurant";

const app = express();
app.use(express.json());

app.use("/api/v1", router);

connectDB({ url: DB_URL }).then(() => {
  app.listen(PORT, () => {
    console.log(`> Restaurant service running on port ${PORT}`);
  });
});
