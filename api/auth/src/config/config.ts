import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  REFRESH_SECRET: required('REFRESH_SECRET'),
  ACCESS_SECRET: required('ACCESS_SECRET'),
  DB_URL: required('DB_URL'),
  PORT: process.env['PORT'] ?? '8000',
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  CORS_ORIGINS: (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000').split(',').map((o) => o.trim()),
} as const;
