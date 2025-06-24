import express from "express";
import {
  registerUser,
  verifyOtp,
  submitKyc,
  loginWithPassword,
  sendOtp,
  getUserByToken,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginWithPassword);
router.post("/sendOtp", sendOtp);
router.get("/getUserDetails", getUserByToken);
router.post("/verify-otp", verifyOtp);
router.post("/submit-kyc", submitKyc);

export default router;
