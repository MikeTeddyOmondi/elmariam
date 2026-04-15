import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { createError } from '@elmariam/utils';
import { logger } from '@elmariam/utils';
import { User } from '../models/User.js';
import { Token } from '../models/Token.js';
import { config } from '../config/config.js';
import type { TokenPayload } from '@elmariam/types';
import type { RegisterBody, LoginBody } from '../schemas/auth.schemas.js';

const log = logger.child({ controller: 'auth' });

export async function ApiInfo(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    message: 'Auth API',
    description: 'Auth API | Version 1',
  });
}

export async function Register(
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { username, email, id_number, password, userType } = req.body;

  const [userExists, idExists, usernameTaken] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ id_number }),
    User.findOne({ username }),
  ]);

  if (userExists) {
    return next(createError(409, 'Email already registered'));
  }
  if (idExists) {
    return next(createError(409, 'ID number already registered'));
  }
  if (usernameTaken) {
    return next(createError(409, 'Username already taken'));
  }

  const user = new User({
    username,
    email,
    password: await bcryptjs.hash(password, 12),
    id_number,
    userType,
  });

  try {
    const doc = await user.save();
    res.status(201).json({ success: true, data: { userId: doc._id } });
  } catch (err) {
    log.error({ err }, 'Error saving user');
    return next(createError(500, 'Error creating account'));
  }
}

export async function Login(
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Same message for both cases — avoids user enumeration
    return next(createError(401, 'Invalid credentials'));
  }

  const isCorrect = await bcryptjs.compare(password, user.password);
  if (!isCorrect) {
    return next(createError(401, 'Invalid credentials'));
  }

  const tokenPayload: TokenPayload = {
    id: String(user._id),
    userType: user.userType as TokenPayload['userType'],
    email: user.email,
  };

  const refreshToken = jwt.sign(tokenPayload, config.REFRESH_SECRET, {
    expiresIn: '7d',
  });

  // Expire 7 days from now — matches the JWT expiry above
  const expired_at = new Date();
  expired_at.setDate(expired_at.getDate() + 7);

  try {
    await Token.updateOne(
      { user_id: user._id },
      { $set: { token: refreshToken, expired_at } },
      { upsert: true },
    );
  } catch (err) {
    log.error({ err }, 'Error saving refresh token');
    return next(createError(500, 'Error signing in'));
  }

  const accessToken = jwt.sign(tokenPayload, config.ACCESS_SECRET, {
    expiresIn: '30m',
  });

  res.status(200).json({
    success: true,
    data: { accessToken, refreshToken },
  });
}

export async function AuthenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return next(createError(401, 'Unauthenticated'));
    }

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      return next(createError(401, 'Unauthenticated'));
    }

    let payload: TokenPayload;
    try {
      payload = jwt.verify(accessToken, config.ACCESS_SECRET) as TokenPayload;
    } catch {
      return next(createError(401, 'Invalid token'));
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return next(createError(401, 'Invalid token'));
    }

    const { id_number: _, password: __, isAdmin: ___, isActive: ____, isVerified: _____, resetLink: ______, ...data } =
      user.toObject();

    res.status(200).json({ success: true, data: { user: data } });
  } catch (err) {
    return next(createError(500, (err as Error).message));
  }
}

export async function Accounts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await User.find({}, '-password -id_number -resetLink');
    res.status(200).json({ success: true, data: { users } });
  } catch (err) {
    log.error({ err }, 'Error fetching accounts');
    return next(createError(500, (err as Error).message));
  }
}

export async function Refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.headers['x-refresh-token'] as string | undefined;
    if (!refreshToken) {
      return next(createError(401, 'Unauthenticated'));
    }

    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, config.REFRESH_SECRET) as TokenPayload;
    } catch {
      return next(createError(401, 'Invalid or expired refresh token'));
    }

    const saved = await Token.findOne({ user_id: payload.id });
    if (!saved || saved.token !== refreshToken) {
      return next(createError(401, 'Unauthenticated'));
    }

    const accessToken = jwt.sign(
      { id: payload.id, userType: payload.userType, email: payload.email },
      config.ACCESS_SECRET,
      { expiresIn: '30m' },
    );

    res.status(200).json({ success: true, data: { accessToken } });
  } catch (err) {
    log.error({ err }, 'Error refreshing token');
    return next(createError(401, 'Unauthenticated'));
  }
}

export async function Logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  const refreshToken = req.headers['x-refresh-token'] as string | undefined;

  if (!refreshToken) {
    return next(createError(401, 'Unauthenticated'));
  }

  try {
    await Token.findOneAndDelete({ token: refreshToken });
    res.status(200).json({ success: true, message: 'Sign out successful' });
  } catch (err) {
    log.error({ err }, 'Error during logout');
    return next(createError(500, 'Error signing out'));
  }
}
