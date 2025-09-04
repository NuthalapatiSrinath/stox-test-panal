import express from "express";
import { addAdmin, adminLoginWithPassword, changeAdminPassword, getAdmin, getPendingRequests, getPendingWithdrawalRequestsByDate, handleAdminWithdrawAction, uploadAdminProfile } from "../controllers/adminController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { onlySuperAdmin } from "../middlewares/checkAdminRole.js";

const router = express.Router();

router.post("/createAdmin",verifyToken,onlySuperAdmin,addAdmin);
router.post("/adminLogin",adminLoginWithPassword);
router.get("/getAdmin",getAdmin);
router.post('/change-password',changeAdminPassword);
router.post('/uploadProfice-picture',uploadAdminProfile);
router.post('/handleWithdrawRequests',handleAdminWithdrawAction);
router.post('/getRequestsByDate',getPendingWithdrawalRequestsByDate);
router.get('/getPendingList',getPendingRequests);
export default router;