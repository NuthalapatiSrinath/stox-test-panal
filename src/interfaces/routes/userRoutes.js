import express from "express";
import {
  registerUser,
  verifyOtp,
  loginWithPassword,
  sendOtp,
  getUserByToken,
  getAllUsersForAdminDashboard,
  getUsersForAdminUserManagement,
  getUserForAdmin,
  filterActiveAndInactiveUsers,
  participationHistory,
  updateWalletAndActive,
  uploadProfilePic
} from "../controllers/userController.js";
import { userSignupValidator,userLoginValidator } from "../../utils/validators.js";
import { handleValidation } from "../middlewares/handleValidation.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginWithPassword);
router.post("/sendOtp", sendOtp);
router.get("/getUserDetails", getUserByToken);
router.post("/verify-otp", verifyOtp); 
router.get("/admin/dashboard/users",getAllUsersForAdminDashboard);
router.get("/getUsersForUserManagement",getUsersForAdminUserManagement);
router.post("/updateUserInfo",updateWalletAndActive);
router.post("/getUser",getUserForAdmin);
router.post("/getUserBasedOnIsActive",filterActiveAndInactiveUsers);
router.post("/participationHistory",participationHistory);
router.post("/uploadProfilePic",verifyToken,uploadProfilePic);
export default router;
