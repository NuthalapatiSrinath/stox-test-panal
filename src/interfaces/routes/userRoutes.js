import express from "express";
import {
  registerUser,
  verifyOtp,
  submitKyc,
  loginWithPassword,
  sendOtp,
  getUserByToken,
} from "../controllers/userController.js";
import { userSignupValidator,userLoginValidator } from "../../utils/validators.js";
import { handleValidation } from "../middlewares/handleValidation.js";

const router = express.Router();


router.post("/register",userSignupValidator,handleValidation, registerUser);
router.post("/login",userLoginValidator,handleValidation, loginWithPassword);
router.post("/sendOtp", sendOtp);
router.get("/getUserDetails", getUserByToken);
router.post("/verify-otp", verifyOtp);
router.post("/submit-kyc", submitKyc);

export default router;
