import express from "express";
import {
  registerUser,
  verifyOtp,
  loginWithPassword,
  sendOtp,
  getUserByToken,
  getAllUsersForAdminDashboard,
  getUsersForAdminUserManagement,
  updateUserInfo,
  getUserForAdmin,
  filterActiveAndInactiveUsers
} from "../controllers/userController.js";
import { userSignupValidator,userLoginValidator } from "../../utils/validators.js";
import { handleValidation } from "../middlewares/handleValidation.js";

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginWithPassword);
router.post("/sendOtp", sendOtp);
router.get("/getUserDetails", getUserByToken);
router.post("/verify-otp", verifyOtp); 
router.get("/admin/dashboard/users",getAllUsersForAdminDashboard);
router.get("/getUsersForUserManagement",getUsersForAdminUserManagement);
router.post("/updateUserInfo",updateUserInfo);
router.post("/getUser",getUserForAdmin);
router.post("/getUserBasedOnIsActive",filterActiveAndInactiveUsers)
export default router;
