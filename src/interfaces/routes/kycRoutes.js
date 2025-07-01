import express from "express";
import {
  updateKycInfo,
  getPendingKycUsers,
  uploadDocumentUrl,
  extractPanController,updateKycStatus
} from "../controllers/kycController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../../application/services/s3Upload.js";
const router = express.Router();
router.put("/kycUpdate",verifyToken, updateKycInfo);
router.put("/upload-document",verifyToken, uploadDocumentUrl);
router.get("/kycPneding",getPendingKycUsers);
router.post("/extract-pan",upload(process.env.S3_BUCKET_NAME).single("image"),extractPanController);
router.put("/kycStatus-update",updateKycStatus);
export default router;