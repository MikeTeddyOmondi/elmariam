import type { Request, Response } from "express";
import type { RabbitMQConfig } from "@elmariam/queue";
import { getDb } from "./db";

const TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
    ),
  ]);
}

/**
 * GET /health: 200 when Mongo answers and every consumed queue still has a
 * consumer, 503 otherwise.
 *
 * "Channel open" alone is not enough: after a broker restart the queue client
 * reconnects without re-attaching its consumers, so the service looks connected
 * while nothing is processed. Asking the broker for each queue's consumer count
 * catches exactly that.
 */
export function healthHandler(rabbitMQ: RabbitMQConfig, queues: readonly string[]) {
  return async (_req: Request, res: Response) => {
    const checks: Record<string, string> = {};
    let ok = true;

    try {
      await withTimeout(getDb().command({ ping: 1 }), "mongo");
      checks.mongo = "ok";
    } catch (e: any) {
      ok = false;
      checks.mongo = e.message;
    }

    if (!rabbitMQ.isConnected()) {
      ok = false;
      checks.rabbitmq = "not connected";
    } else {
      for (const q of queues) {
        try {
          const { consumerCount } = await withTimeout(rabbitMQ.checkQueue(q), `queue ${q}`);
          if (consumerCount > 0) {
            checks[`queue:${q}`] = "ok";
          } else {
            ok = false;
            checks[`queue:${q}`] = "no consumer";
          }
        } catch (e: any) {
          ok = false;
          checks[`queue:${q}`] = e.message;
        }
      }
    }

    res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "unhealthy", checks });
  };
}
