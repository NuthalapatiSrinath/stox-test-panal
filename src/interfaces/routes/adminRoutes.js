import express from "express";
import { addAdmin, adminLoginWithPassword, changeAdminPassword, getAdmin, uploadAdminProfile } from "../controllers/adminController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/createAdmin",addAdmin);
router.post("/adminLogin",adminLoginWithPassword);
router.get("/getAdmin",getAdmin);
router.post('/change-password', verifyToken, changeAdminPassword);
router.post('/uploadProfice-picture',uploadAdminProfile);
export default router;