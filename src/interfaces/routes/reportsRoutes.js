import express from "express";
import { getContestPerformanceReport, getParticipationReport, getRevenueSummary, getTransactionSummaryReport } from "../controllers/reportsController.js";
import { onlySuperAdmin } from "../middlewares/checkAdminRole.js";
import { verifyToken } from "../middlewares/verifyToken.js";
const router = express.Router();
router.get("/participation",verifyToken,onlySuperAdmin, getParticipationReport);
router.get("/contest-performance",verifyToken,onlySuperAdmin, getContestPerformanceReport);
router.get("/getRevenueSummary",verifyToken,onlySuperAdmin,getRevenueSummary);
router.get("/getTransactionSummary",verifyToken,onlySuperAdmin,getTransactionSummaryReport)
export default router;