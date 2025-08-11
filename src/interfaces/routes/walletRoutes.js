import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { getAllTransactions, getTransactionDetails, topUpWallet, withdrawWallet } from "../controllers/walletController.js";
const router = express.Router();
router.post("/getTransaction",getTransactionDetails);
router.post("/getUserTransaction",verifyToken,getTransactionDetails)
router.post("/topUpWallet",verifyToken,topUpWallet);
router.post("/withdraw",verifyToken,withdrawWallet); 
router.get("/getAllTransactions",getAllTransactions);
export default router; 