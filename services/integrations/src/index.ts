import express from "express";
import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue";
import { handleMpesa } from "./consumers/mpesa";
import { handleSms } from "./consumers/sms";
import { handleSmtp } from "./consumers/smtp";
import { env } from "./config/env";

const app = express();
app.get("/", (_req, res) => {
  res.json({ apiVersion: "1.0.0", apiDescription: "Integrations Service (mpesa + sms + smtp)" });
});

const rabbitMQ = new RabbitMQConfig(rabbitMQEnvFromProcess(), {
  maxRetries: 10,
  initialDelay: 2000,
  maxDelay: 60000,
});

async function startConsumers() {
  await rabbitMQ.connect();

  await rabbitMQ.createQueue("mpesa");
  await rabbitMQ.subscribeToQueue("mpesa", handleMpesa);
  console.log(`👂  Listening on "mpesa" queue`);

  await rabbitMQ.createQueue("sms");
  await rabbitMQ.subscribeToQueue("sms", handleSms);
  console.log(`👂  Listening on "sms" queue`);

  await rabbitMQ.createQueue("mails");
  await rabbitMQ.subscribeToQueue("mails", handleSmtp);
  console.log(`👂  Listening on "mails" queue`);

  app.listen(env.PORT, () => {
    console.log(`> Integrations service running on port ${env.PORT}`);
  });
}

startConsumers().catch((err) => {
  console.error("Failed to start integrations service:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await rabbitMQ.close();
  process.exit(0);
});
