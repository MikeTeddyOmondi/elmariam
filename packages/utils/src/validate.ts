import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { createError } from './errors.js';

export { z };

export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(createError(400, result.error.issues.map((e: { message: string }) => e.message).join(', ')));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: z.ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(createError(400, result.error.issues.map((e: { message: string }) => e.message).join(', ')));
      return;
    }
    req.params = result.data as Record<string, string>;
    next();
  };
}
