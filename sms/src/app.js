const express = require("express");
const amqplib = require("amqplib/callback_api");
const { RABBITMQ_URL } = require("./config");
const { sendSMS } = require("./utils/notifier");

const app = express();

// RabbitMQ configuration

// Create Connection
amqplib.connect(RABBITMQ_URL, (connError, connection) => {
  if (connError) {
    console.log({ error: connError.message });
    throw connError;
  }
  // Create Channel
  connection.createChannel((channelError, channel) => {
    if (channelError) {
      throw channelError;
    }

    // Assert the queue exists
    const QUEUE = "sms";
    channel.assertQueue(QUEUE);

    // Send message to the queue
    // channel.sendToQueue(QUEUE, Buffer.from('hello from its coding time'));
    // console.log(`Message send ${QUEUE}`);

    // Receiving messages from the queue
    channel.consume(
      QUEUE,
      (msg) => {
        console.log(`Message received from: ${QUEUE} queue`);
        // console.log(`Message content: ${msg.content.toString("utf8")}`);
        const msgData = msg.content.toString("utf8");

        // Send email to user
        const data = JSON.parse(msgData);
        sendSMS(data);
      },
      {
        noAck: true,
      }
    );
  });
});

module.exports = app;
