const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { MinioStorageEngine } = require("@namatery/multer-minio");

const { Client } = require("minio");

const {
  CLOUDINARY_CLOUDNAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_API_HOST,
} = require("../config/config.js");

if (
  MINIO_ACCESS_KEY == undefined ||
  MINIO_SECRET_KEY == undefined ||
  MINIO_API_HOST == undefined
) {
  console.error("[#] Configuration required!");
  // process.exit(1);
}

const BUCKET_NAME = String("hotel-elmariam");

// Instantiate the minio client with
// the endpoint and access keys
const minioClient = new Client({
  endPoint: MINIO_API_HOST,
  port: 9003,
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

// For Production workloads
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUDNAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hotel-elmariam",
  },
});

const minioStorageEngineOptions = {
  path: "photos",
  region: "us-east-1",
  bucket: {
    init: true,
    versioning: false,
    forceDelete: false,
  },
  object: {
    name: (req, file) => {
      // return `${new Date()}-${file.originalname}`;
      return `${file.originalname}`;
    },
    useOriginalFilename: false,
  },
};

const minioStorage = new MinioStorageEngine(
  minioClient,
  BUCKET_NAME,
  minioStorageEngineOptions
);

// using Multer middleware with Cloudinary storage engine
// const imageUploads = multer({ storage }).single("file");

// using Multer middleware with no storage engines
// const imageUploads = multer({ storage: multer.memoryStorage() }).single("file");
// const imageUploads = multer({ storage: multer.diskStorage() }).single("file");
// const imageUploads = multer().single("file");

// using Multer middleware with Minio storage engine
const imageUploads = multer({ storage: minioStorage }).single("file");

module.exports = { imageUploads };
