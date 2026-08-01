import { form } from '$app/server';
import { invalid } from '@sveltejs/kit';
import * as v from 'valibot';
import { RabbitMQConfig, rabbitMQEnvFrom } from '@elmariam/queue';
// `$env/dynamic/private`, not `process.env`: Vite does not copy `.env` files
// into `process.env`, so reading it there yields every default and the
// connection fails on the wrong vhost.
import { env } from '$env/dynamic/private';

/**
 * Publishes a website enquiry to the `mails` queue, where the SMTP consumer in
 * `services/integrations` forwards it to the business inbox.
 *
 * Public and unauthenticated by design — anyone may contact the hotel.
 */
export const sendContactMessage = form(
  v.object({
    name: v.pipe(v.string(), v.minLength(1, 'Your name is required')),
    email: v.pipe(v.string(), v.email('Enter a valid email address')),
    message: v.pipe(v.string(), v.minLength(10, 'Please write at least a short message')),
  }),
  async (data) => {
    const queue = new RabbitMQConfig(rabbitMQEnvFrom(env));
    try {
      await queue.connect();
      await queue.createQueue('mails');
      await queue.publishToQueue('mails', { type: 'contact-enquiry', ...data });
    } catch (e) {
      // Surface a failure rather than thanking someone whose message was lost.
      console.error('[contact] failed to queue enquiry:', e);
      invalid('We could not send your message just now. Please try again shortly.');
    } finally {
      await queue.close().catch(() => {});
    }

    return { sent: true };
  }
);
