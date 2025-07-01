import express from "express";
import {
  updateKycInfo,
  getPendingKycUsers,
  uploadDocumentUrl,
} from "../controllers/kycController.js";

import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();
router.put("/kycUpdate",verifyToken, updateKycInfo);
router.post("/upload-document",verifyToken, uploadDocumentUrl);
router.get("/kycPneding",getPendingKycUsers);
export default router;
