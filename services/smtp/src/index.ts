import express from "express";
import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue";
import { sendMail } from "./utils/sendMail";

const PORT = process.env.PORT || 3300;

const app = express();
app.get("/", (_req, res) => {
  res.json({ apiVersion: "1.0.0", apiDescription: "SMTP Service" });
});

const rabbitMQ = new RabbitMQConfig(rabbitMQEnvFromProcess(), {
  maxRetries: 10,
  initialDelay: 2000,
  maxDelay: 60000,
});

(async () => {
  await rabbitMQ.connect();
  await rabbitMQ.createQueue("mails");
  await rabbitMQ.subscribeToQueue("mails", sendMail);
  console.log(`👂  SMTP service listening on "mails" queue...`);

  app.listen(PORT, () => {
    console.log(`> SMTP service running on port ${PORT}`);
  });
})();

process.on("SIGINT", async () => {
  await rabbitMQ.close();
  process.exit(0);
});
