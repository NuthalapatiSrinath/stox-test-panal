import  { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const s3 = new S3Client({
  region: process.env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});  

export const upload = (bucketName) =>
  multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, `uploads/${Date.now()}-${file.originalname}`);
      },
    }),
      limits: {
    fileSize: 1 * 1024 * 1024
  },
  });

  export const uploadProfileImage = (bucketName) =>
  multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: (req, file, cb ) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        cb(null, `profilepic/${Date.now()}-${file.originalname}`);
      },
    }),
    limits: { fileSize: 1 * 1024 * 1024 },
  });

  export const uploadNotificationImage = (bucketName) =>
  multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        cb(null, `notifications/${Date.now()}-${file.originalname}`);
      },
    }),
    limits: { fileSize: 1 * 1024 * 1024 },
  });

    export const uploadAdminProfileImage = (bucketName) =>
  multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: (req, file, cb ) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        cb(null, `adminprofilepic/${Date.now()}-${file.originalname}`);
      },
    }),
    limits: { fileSize: 1 * 1024 * 1024 },
  });