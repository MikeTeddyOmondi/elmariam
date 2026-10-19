import {
  S3Client,
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';

/**
 * Public image storage on RustFS (S3-compatible).
 *
 * One bucket, readable by anyone through a GetObject-only bucket policy. Writes
 * need the root credentials, which only this server holds: browsers upload
 * through short-lived presigned PUT URLs that this server signs.
 */

export const PUBLIC_BUCKET = env.S3_PUBLIC_BUCKET || 'elmariam-public';
const REGION = env.S3_REGION || 'us-east-1';
// In-network endpoint for server-side calls.
const ENDPOINT = env.S3_ENDPOINT || 'http://rustfs:9000';
// The origin browsers reach, used for presigning and for public object URLs.
const PUBLIC_URL = (env.S3_PUBLIC_URL || 'https://s3.otienoobogeandcompany.com').replace(/\/$/, '');

const credentials = {
  accessKeyId: env.RUSTFS_ACCESS_KEY || 'minio',
  secretAccessKey: env.RUSTFS_SECRET_KEY || 'minio_password',
};

const s3 = new S3Client({ endpoint: ENDPOINT, region: REGION, credentials, forcePathStyle: true });

// SigV4 covers the host header, so a URL the browser will use has to be signed
// for the public host; rewriting the host after signing breaks the signature.
const s3Public = new S3Client({ endpoint: PUBLIC_URL, region: REGION, credentials, forcePathStyle: true });

export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

let bucketReady: Promise<void> | null = null;

/**
 * Creates the bucket and applies the public-read policy, once per process.
 * Idempotent, so it is safe on every cold start and across replicas.
 */
export function ensurePublicBucket(): Promise<void> {
  bucketReady ??= (async () => {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: PUBLIC_BUCKET }));
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: PUBLIC_BUCKET }));
    }
    // Reapplied every start so a hand edit in the console cannot quietly widen
    // or remove it: anonymous GetObject and nothing else.
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${PUBLIC_BUCKET}/*`],
        },
      ],
    };
    await s3.send(new PutBucketPolicyCommand({ Bucket: PUBLIC_BUCKET, Policy: JSON.stringify(policy) }));
  })().catch((e) => {
    // Let the next call retry instead of caching the failure.
    bucketReady = null;
    throw e;
  });
  return bucketReady;
}

export function publicUrl(key: string): string {
  return `${PUBLIC_URL}/${PUBLIC_BUCKET}/${key}`;
}

/** The object key for one of our public URLs, or null for anything else. */
export function keyFromPublicUrl(url: string | undefined | null): string | null {
  const prefix = `${PUBLIC_URL}/${PUBLIC_BUCKET}/`;
  return url?.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export async function presignImageUpload(key: string, contentType: string, size: number) {
  await ensurePublicBucket();
  const cmd = new PutObjectCommand({
    Bucket: PUBLIC_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  // Content-type and length are signed too. Unsigned, a client could presign a
  // small JPEG and then PUT anything of any size, and on a public bucket the
  // stored type is what gets served back (stored XSS with text/html).
  return getSignedUrl(s3Public, cmd, {
    expiresIn: 300,
    signableHeaders: new Set(['content-type', 'content-length']),
  });
}

/** Confirms an upload landed with an allowed type and size. */
export async function verifyImage(key: string): Promise<boolean> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key }));
    return (
      !!head.ContentType &&
      head.ContentType in IMAGE_TYPES &&
      (head.ContentLength ?? Infinity) <= MAX_IMAGE_BYTES
    );
  } catch {
    return false;
  }
}

/** Best-effort removal of a replaced image; a leftover object is harmless. */
export async function deleteImage(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key })).catch(() => {});
}
