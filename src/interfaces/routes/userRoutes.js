import express from "express";
import {
  registerUser,
  verifyOtp,
  loginWithPassword,
  sendOtp,
  getUserByToken,
} from "../controllers/userController.js";
import { userSignupValidator,userLoginValidator } from "../../utils/validators.js";
import { handleValidation } from "../middlewares/handleValidation.js";

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginWithPassword);
router.post("/sendOtp", sendOtp);
router.get("/getUserDetails", getUserByToken);
router.post("/verify-otp", verifyOtp); 

export default router;
