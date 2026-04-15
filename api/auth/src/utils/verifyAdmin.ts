import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { createError } from '@elmariam/utils';
import { config } from '../config/config.js';
import type { TokenPayload } from '@elmariam/types';

export function verifyAdmin(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next(createError(401, 'Unauthenticated request'));
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    return next(createError(401, 'Unauthenticated request'));
  }

  try {
    const payload = jwt.verify(accessToken, config.ACCESS_SECRET) as TokenPayload;
    if (payload.userType !== 'management') {
      return next(createError(403, 'Unauthorized request'));
    }
    next();
  } catch {
    return next(createError(401, 'Invalid token'));
  }
}
