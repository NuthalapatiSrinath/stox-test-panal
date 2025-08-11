import express from "express";
import { fetchAndStoreTickers,updateSelectedStocks,getSelectedStocks, getTotalStocks, replaceStock, fetchAndStore } from "../controllers/stockController.js";
const router = express.Router();
router.get("/store",fetchAndStoreTickers)
router.get("/test",fetchAndStore)
router.get("/available", getTotalStocks);
router.post("/select",updateSelectedStocks);
router.get("/getSelectedStocks",getSelectedStocks);
router.post("/replaceStockWithAnother",replaceStock);
export default router;