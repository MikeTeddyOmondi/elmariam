import express from "express";
import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue";
import { sendSMS } from "./utils/sendSMS";

const PORT = process.env.PORT || 7879;

const app = express();
app.get("/", (_req, res) => {
  res.json({ apiVersion: "1.0.0", apiDescription: "SMS Service" });
});

const rabbitMQ = new RabbitMQConfig(rabbitMQEnvFromProcess(), {
  maxRetries: 10,
  initialDelay: 2000,
  maxDelay: 60000,
});

(async () => {
  await rabbitMQ.connect();
  await rabbitMQ.createQueue("sms");
  await rabbitMQ.subscribeToQueue("sms", sendSMS);
  console.log(`👂  SMS service listening on "sms" queue...`);

  app.listen(PORT, () => {
    console.log(`> SMS service running on port ${PORT}`);
  });
})();

process.on("SIGINT", async () => {
  await rabbitMQ.close();
  process.exit(0);
});
