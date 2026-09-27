import amqp, { Channel, ChannelModel } from "amqplib";

interface RabbitMQRetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
}

interface RabbitMQEnv {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
}

export class RabbitMQConfig {
  private url: string;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private retryOptions: Required<RabbitMQRetryOptions>;

  constructor(env: RabbitMQEnv, retryOptions: RabbitMQRetryOptions = {}) {
    this.url = `amqp://${env.username}:${env.password}@${env.host}:${env.port}/${env.vhost}`;
    this.retryOptions = {
      maxRetries: retryOptions.maxRetries ?? 5,
      initialDelay: retryOptions.initialDelay ?? 1000,
      maxDelay: retryOptions.maxDelay ?? 30000,
      factor: retryOptions.factor ?? 2,
    };
  }

  private calculateDelay(attempt: number): number {
    const delay =
      this.retryOptions.initialDelay *
      Math.pow(this.retryOptions.factor, attempt);
    return Math.min(delay, this.retryOptions.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async connect(): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.retryOptions.maxRetries; attempt++) {
      try {
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();

        this.connection.on("error", (err) => {
          console.error(`❌  RabbitMQ connection error: ${err.message}`);
        });

        this.connection.on("close", () => {
          console.log(
            `⚠️  RabbitMQ connection closed. Attempting to reconnect...`
          );
          this.reconnect();
        });

        console.log(`✅  Connected to RabbitMQ server!`);
        return;
      } catch (error: any) {
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

    console.error(
      `❌  Failed to connect to RabbitMQ after ${this.retryOptions.maxRetries} attempts`
    );
    throw lastError;
  }

  private async reconnect() {
    this.channel = null;
    this.connection = null;
    await this.sleep(this.retryOptions.initialDelay);
    await this.connect();
  }

  async createQueue(queueName: string, options?: amqp.Options.AssertQueue): Promise<void> {
    if (!this.channel) throw new Error("RabbitMQ channel not initialized");
    await this.channel.assertQueue(queueName, { durable: true, ...options });
  }

  async publishToQueue(queueName: string, message: object): Promise<boolean> {
    if (!this.channel) throw new Error("RabbitMQ channel not initialized");
    return this.channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async subscribeToQueue(
    queueName: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) throw new Error("RabbitMQ channel not initialized");
    await this.channel.prefetch(1);
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;
      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        this.channel!.ack(msg);
      } catch (error: any) {
        console.error(`❌  Error processing message: ${error.message}`);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // ignore close errors
    }
  }
}

/**
 * Builds the connection config from an arbitrary env source.
 *
 * SvelteKit apps must pass `$env/dynamic/private` rather than relying on
 * `process.env`: Vite does not copy `.env` files into `process.env`, so
 * `rabbitMQEnvFromProcess()` silently falls back to every default: including
 * vhost `"/"`, which does not exist in this deployment and fails the handshake.
 */
export function rabbitMQEnvFrom(source: Record<string, string | undefined>): RabbitMQEnv {
  return {
    host: source.RABBITMQ_HOST || "localhost",
    port: parseInt(source.RABBITMQ_PORT || "5672"),
    username: source.RABBITMQ_USERNAME || "user",
    password: source.RABBITMQ_PASSWORD || "password",
    // The stack provisions the `elmariam` vhost, not the AMQP default `/`.
    vhost: source.RABBITMQ_VHOST || "elmariam",
  };
}

/** For plain Node services (`services/integrations`, `infra/openauth`). */
export function rabbitMQEnvFromProcess(): RabbitMQEnv {
  return rabbitMQEnvFrom(process.env);
}

// ── Notifications: shared M-Pesa + SMS publishers ───────────────────────────
// One implementation both apps reuse, so phone/queue logic is not copied.

/** Normalise a Kenyan phone to 254 country-code digits, or "" if none. */
export function toMsisdn(v: unknown): string {
  const d = String(v ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("254")) return d;
  if (d.startsWith("0")) return "254" + d.slice(1);
  if (d.length === 9) return "254" + d; // 7XXXXXXXX
  return d;
}

/** UjumbeSMS wants the local "07XXXXXXXX" form. */
export function toLocalPhone(v: unknown): string {
  const m = toMsisdn(v);
  return m.startsWith("254") ? "0" + m.slice(3) : m;
}

export interface MpesaStkInput {
  amount: number;
  phone: string | number;
  reference: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** Publish an M-Pesa STK push request to the `mpesa` queue. */
export async function publishMpesaStk(
  env: Record<string, string | undefined>,
  input: MpesaStkInput,
): Promise<void> {
  const queue = new RabbitMQConfig(rabbitMQEnvFrom(env));
  await queue.connect();
  await queue.createQueue("mpesa");
  await queue.publishToQueue("mpesa", {
    first_name: input.firstName ?? "Walk-in",
    last_name: input.lastName ?? "Customer",
    email: input.email ?? "sales@elmariam.co.ke",
    host: "hotel-elmariam",
    amount: input.amount,
    phone_number: toMsisdn(input.phone),
    api_ref: input.reference,
  });
  await queue.close();
}

/** Publish an SMS to the `sms` queue. */
export async function publishSms(
  env: Record<string, string | undefined>,
  input: { phone: string | number; message: string },
): Promise<void> {
  const queue = new RabbitMQConfig(rabbitMQEnvFrom(env));
  await queue.connect();
  await queue.createQueue("sms");
  await queue.publishToQueue("sms", {
    message: input.message,
    phoneNumbers: toLocalPhone(input.phone),
  });
  await queue.close();
}
