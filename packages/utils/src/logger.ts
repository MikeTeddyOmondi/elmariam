import pino from 'pino';
import type { Request, Response, NextFunction } from 'express';

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport:
    process.env['NODE_ENV'] !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: { service: process.env['SERVICE_NAME'] ?? 'unknown' },
});

export function requestLogger() {
  return (req: Request & { requestId?: string; log?: pino.Logger }, res: Response, next: NextFunction) => {
    const id = crypto.randomUUID();
    req.requestId = id;
    req.log = logger.child({ requestId: id });
    res.setHeader('X-Request-Id', id);
    req.log.info({ method: req.method, url: req.url }, 'incoming request');
    next();
  };
}
