import { Client } from "minio";
import multer from "multer";
import { MinioStorageEngine } from "@namatery/multer-minio";

const MINIO_API_HOST = process.env.MINIO_API_HOST || "localhost";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";
export const S3_HOSTNAME = process.env.S3_HOSTNAME || "s3.otienoobogeandcompany.com";
export const BUCKET_NAME = "hotel-elmariam";

export const minioClient = new Client({
  endPoint: MINIO_API_HOST,
  port: 9000,
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

const storage = new MinioStorageEngine(minioClient, BUCKET_NAME, {
  bucket: { init: true, versioning: false as const, forceDelete: false },
});

export const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.split("/")[0] !== "image") {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});
