const amqp = require("amqplib");

// RABBITMQ configuration options
const {
  RABBITMQ_HOST,
  RABBITMQ_PORT,
  RABBITMQ_USERNAME,
  RABBITMQ_PASSWORD,
  RABBITMQ_VHOST,
} = process.env;

// RABBITMQ connection URL
const RABBITMQ_URL = `amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}/${RABBITMQ_VHOST}`;

class RabbitMQConfig {
  constructor(retryOptions = {}) {
    this.channel = null;
    this.connection = null;
    this.retryOptions = {
      maxRetries: retryOptions.maxRetries || 5,
      initialDelay: retryOptions.initialDelay || 1000, // 1 second
      maxDelay: retryOptions.maxDelay || 30000, // 30 seconds
      factor: retryOptions.factor || 2, // exponential factor
    };
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  calculateDelay(attempt) {
    const delay = this.retryOptions.initialDelay * Math.pow(this.retryOptions.factor, attempt);
    return Math.min(delay, this.retryOptions.maxDelay);
  }

  async connect() {
    let lastError;

    for (let attempt = 0; attempt < this.retryOptions.maxRetries; attempt++) {
      try {
        this.connection = await amqp.connect(RABBITMQ_URL);
        this.channel = await this.connection.createChannel();

        // Handle connection errors for automatic reconnection
        this.connection.on('error', (err) => {
          console.error(`❌  RabbitMQ connection error: ${err.message}`);
        });

        this.connection.on('close', () => {
          console.log(`⚠️  RabbitMQ connection closed. Attempting to reconnect...`);
          this.reconnect();
        });

        console.log(`✅  Connected to RabbitMQ server!`);
        return;
      } catch (error) {
        lastError = error;
        const delay = this.calculateDelay(attempt);

        console.log(
          `❌  Failed to connect to RabbitMQ (attempt ${attempt + 1}/${this.retryOptions.maxRetries}): ${error.message}`
        );

        if (attempt < this.retryOptions.maxRetries - 1) {
          console.log(`⏳  Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    console.error(`❌  Failed to connect to RabbitMQ after ${this.retryOptions.maxRetries} attempts`);
    throw lastError;
  }

  async reconnect() {
    if (this.channel) {
      this.channel = null;
    }
    if (this.connection) {
      this.connection = null;
    }

    await this.sleep(this.retryOptions.initialDelay);
    await this.connect();
  }

  async createQueue(queueName, options) {
    await this.channel.assertQueue(queueName, options);
  }

  async publishToQueue(queueName, message) {
    this.channel.sendToQueue(queueName, Buffer.from(message));
    console.log(`✅  Sent message to ${queueName} queue in ${RABBITMQ_VHOST} virtual host`);
  }

  async subscribeToQueue(queueName, callback, options) {
    await this.channel.consume(
      queueName,
      (msg) => {
        const message = msg.content.toString();
        callback(message);
        this.channel.ack(msg);
      },
      options
    );
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = RabbitMQConfig;