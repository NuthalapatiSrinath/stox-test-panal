import express from "express";
import { fetchAndStoreTickers,updateSelectedStocks,getSelectedStocks } from "../controllers/stockController.js";
const router = express.Router();

router.get("/available", fetchAndStoreTickers);
router.post("/select",updateSelectedStocks);
router.get("/getSelectedStocks",getSelectedStocks)
export default router;
