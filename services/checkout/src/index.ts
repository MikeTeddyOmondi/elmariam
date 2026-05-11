import { Hono } from "hono";
import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue";
import checkout from "./utils/checkout";

const app = new Hono();
const rabbitMQ = new RabbitMQConfig(rabbitMQEnvFromProcess(), {
  maxRetries: 10,
  initialDelay: 2000,
  maxDelay: 60000,
});

(async () => {
  await rabbitMQ.connect();
  await rabbitMQ.createQueue("mpesa");
  await rabbitMQ.subscribeToQueue("mpesa", checkout);
  console.log(`👂  Listening for messages on mpesa queue...`);
})();

process.on("SIGINT", async () => {
  await rabbitMQ.close();
  process.exit(0);
});

app.get("*", (c) =>
  c.json({ apiVersion: "1.0.0", apiDescription: "Checkout Service" })
);

export default { port: 8008, fetch: app.fetch };
