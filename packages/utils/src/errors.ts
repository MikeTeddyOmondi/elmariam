import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';

export { createHttpError as createError };

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status: number = err.status ?? err.statusCode ?? 500;
  res.status(status).json({
    success: false,
    status,
    data: {
      message: err.message ?? 'Internal server error',
      ...(process.env['NODE_ENV'] !== 'production' && { stack: err.stack }),
    },
  });
}
