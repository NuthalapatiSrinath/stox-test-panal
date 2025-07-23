import express from "express";
import { getContestPerformanceReport, getParticipationReport, getTransactionReport } from "../controllers/reportsController.js";

const router = express.Router();
router.get("/participation", getParticipationReport);
router.get("/contest-performance", getContestPerformanceReport);
router.get("/getTransactionReport",getTransactionReport);
export default router;
