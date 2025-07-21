import express from "express";
import { fetchAndStoreTickers,updateSelectedStocks,getSelectedStocks, getTotalStocks } from "../controllers/stockController.js";
const router = express.Router();

router.get("/available", getTotalStocks);
router.post("/select",updateSelectedStocks);
router.get("/getSelectedStocks",getSelectedStocks)
export default router;
