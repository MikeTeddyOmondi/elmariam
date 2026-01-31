const express = require("express");
const RabbitMQConfig = require("./utils/rabbitmq.config");
const { sendSMS } = require("./utils/notifier");

const app = express();

// RabbitMQ configuration with retry options
const rabbitMQ = new RabbitMQConfig({
  maxRetries: 10,
  initialDelay: 2000,
  maxDelay: 60000,
  factor: 2,
});

const QUEUE = "sms";

// Initialize RabbitMQ connection and consumer
async function initializeRabbitMQ() {
  try {
    // Connect to RabbitMQ with exponential backoff
    await rabbitMQ.connect();

    // Create/assert the queue exists
    await rabbitMQ.createQueue(QUEUE, { durable: true });

    // Subscribe to queue and process messages
    await rabbitMQ.subscribeToQueue(
      QUEUE,
      async (message) => {
        console.log(`Message received from: ${QUEUE} queue`);

        try {
          const data = JSON.parse(message);
          await sendSMS(data);
        } catch (error) {
          console.error(`❌  Error processing message: ${error.message}`);
          // Optionally: implement dead letter queue logic here
          // TODO: Publishing messages to DLQ for failed processing can be implemented here
          // async function publishSMSMessage(phoneNumber, message) {
          //   const data = JSON.stringify({ phoneNumber, message });
          //   await rabbitMQ.publishToQueue(QUEUE, data);
          // }
        }
      },
      {
        noAck: false, // Changed to false for better reliability
      },
    );

    console.log(`👂  Listening for messages on ${QUEUE} queue...`);
  } catch (error) {
    console.error(`❌  Failed to initialize RabbitMQ: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏸️  Shutting down gracefully...");
  await rabbitMQ.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏸️  Shutting down gracefully...");
  await rabbitMQ.close();
  process.exit(0);
});

// Start RabbitMQ consumer
initializeRabbitMQ();

module.exports = app;
