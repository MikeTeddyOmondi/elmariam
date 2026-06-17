# Services

This directory contains backend services that run alongside the SvelteKit apps.

## `integrations` (port 8010)

Consolidated service handling all third-party API integrations via RabbitMQ consumers.

| Consumer | Queue | Provider |
|----------|-------|---------|
| M-Pesa STK push | `mpesa` | IntaSend |
| SMS notifications | `sms` | UjumbeSMS |
| Email notifications | `mails` | Gmail OAuth2 + Nodemailer |

SvelteKit remote functions publish messages to these queues using `@elmariam/queue`. The integrations service consumes them and calls the respective external APIs.

### Environment variables

See `.env.sample` at the repo root for all required variables (`INTASEND_*`, `UJUMBESMS_*`, `GMAIL_*`, `RABBITMQ_*`).

### Running locally

```bash
# Start RabbitMQ first
docker compose up -d rabbitmq

# Then run the service
pnpm --filter @elmariam/integrations dev
```
