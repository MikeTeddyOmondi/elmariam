import { z, type ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { createError } from './errors.js';

export { z };

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        createError(
          400,
          result.error.errors.map((e) => e.message).join(', '),
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(
        createError(
          400,
          result.error.errors.map((e) => e.message).join(', '),
        ),
      );
      return;
    }
    req.params = result.data as Record<string, string>;
    next();
  };
}
