import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { logger, requestLogger, errorHandler } from '@elmariam/utils';
import { config } from './config/config.js';
import router from './routes/routes.js';

const log = logger.child({ service: 'auth' });

mongoose.set('strictQuery', true);

mongoose
  .connect(config.DB_URL)
  .then(() => {
    const app = express();

    // ── Security ────────────────────────────────────────────
    app.use(helmet());

    // ── Body parsing ────────────────────────────────────────
    app.use(express.json());
    app.use(cookieParser());

    // ── CORS ────────────────────────────────────────────────
    app.use(
      cors({
        origin: config.CORS_ORIGINS,
        credentials: true,
      }),
    );

    // ── Logging ─────────────────────────────────────────────
    app.use(requestLogger());
    app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // ── Rate limiting ────────────────────────────────────────
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { success: false, data: { message: 'Too many requests, please try again later.' } },
    });

    // ── Health check ────────────────────────────────────────
    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
    });

    // ── Routes ───────────────────────────────────────────────
    app.use('/api/v1', authLimiter, router);

    // ── Error handler ────────────────────────────────────────
    app.use(errorHandler);

    app.listen(config.PORT, () => {
      log.info(`Auth service running on port ${config.PORT}`);
    });
  })
  .catch((err) => {
    log.error({ err }, 'MongoDB connection failed');
    process.exit(1);
  });
