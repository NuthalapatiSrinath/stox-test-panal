import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import users from "../../infrastructure/db/models/userModel.js";
import {
  generateOtp,
  verifyStoredOtp,
  sendOtpEmail,
} from "../services/otpService.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { Op } from "sequelize";
import { HttpResponse } from "../../utils/responses.js";
import { generateToken, verifyTokenFromRequest } from "../middlewares/auth.js";
import { loggerMonitor } from "../../utils/logger.js";

// @desc Register user and send OTP
export const registerUser = async (req, res) => {
  try {
    const { username, emailId, mobileNumber, password } = req.body;
    if (!username || !emailId || !mobileNumber || !password) {
      loggerMonitor.error(HttpResponse.BAD_REQUEST.message,HttpResponse.BAD_REQUEST.code)
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        HttpResponse.BAD_REQUEST.message
      );
    }
    const existingUser = await users.findOne({
      where: {
        [Op.or]: [{ emailId }, { username }, { mobileNumber }],
      },
    });
    if (existingUser) {
      return sendResponse(
        res,
        HttpResponse.ALREADY_EXISTS.code,
        HttpResponse.ALREADY_EXISTS.message
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await users.create({
      userId: uuidv4(),
      emailId,
      username,
      password: passwordHash,
      mobileNumber,
    });
    loggerMonitor.info(HttpResponse.OK.code, HttpResponse.OK.message);
    // await sendOtp(newUser.userId, newUser.mobileNumber, 'email_verification');
    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      newUser
    );
  } catch (error) {
    loggerMonitor.error(HttpResponse.INTERNAL_SERVER_ERROR.message,HttpResponse.INTERNAL_SERVER_ERROR.code)
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      error.message
    );
  }
};
//@desc Login
export const loginWithPassword = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await users.findOne({ emailId });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      loggerMonitor.error(res,HttpResponse.BAD_REQUEST.message,HttpResponse.BAD_REQUEST.code)
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        HttpResponse.BAD_REQUEST.message
      );
    }
    user.loginAttempts += 1;
    await user.save();
    if (user.isBlocked === true) {
      return sendResponse(
        res,
        HttpResponse.UNAUTHORIZED.code,
        HttpResponse.UNAUTHORIZED.message
      );
    }
    user.lastLoginAt = new Date();
    user.loginAttempts = 0;
    await user.save();
    const token = generateToken({
      userId: user.userId,
      role: user.role,
      email: user.emailId,
    });
    loggerMonitor.info(HttpResponse.OK.code, HttpResponse.OK.message);
    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      token
    );
  } catch (err) {
    loggerMonitor.error(HttpResponse.INTERNAL_SERVER_ERROR.code, HttpResponse.INTERNAL_SERVER_ERROR.message);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
//@desc Send Otp
export const sendOtp = async (req, res) => {
  try {
    const { emailId, type } = req.body;
    const user = await users.findOne({ emailId });
    if (!user) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message
      );
    }
    const otp = await generateOtp();
    const hashOtp = await bcrypt.hash(otp, 10);
    console.log(otp);
    user.otpCode = hashOtp;
    user.otpType = type;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpLastSentAt = new Date();
    user.otpAttemptCount = 0;
    await sendOtpEmail(emailId, otp);
    await user.save();
    logger.log("info", HttpResponse.OK.code, HttpResponse.OK.message);
    return sendResponse(res, HttpResponse.OK.code, HttpResponse.OK.message);
  } catch (err) {
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
// @desc Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "User ID and OTP are required" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await verifyStoredOtp(
      user.userId,
      otp,
      "email_verification"
    );
    if (!isValid)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getUserByToken = async (req, res) => {
  try {
    const decoded = verifyTokenFromRequest(req);
    const { userId } = decoded;

    const user = await users
      .findOne({ userId })
      .select(
        "-password -otpCode -otpExpiresAt -otpAttemptCount -otpLastSentAt -documentImageUrl"
      );

    if (!user) {
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        HttpResponse.BAD_REQUEST.message
      );
    }

    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      user
    );
  } catch (err) {
    console.error("Token verify failed:", err.message);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
// @desc Submit KYC details
export const submitKyc = async (req, res) => {
  try {
    const {
      userId,
      fullName,
      dateOfBirth,
      documentType,
      documentNumber,
      documentImageUrl,
    } = req.body;

    const user = await users.findByPk(userId);
    if (!user) return sendError(res, { message: "User not found" }, 404);

    user.fullName = fullName;
    user.dateOfBirth = dateOfBirth;
    user.documentType = documentType;
    user.documentNumber = documentNumber;
    user.documentImageUrl = documentImageUrl;
    user.kycStatus = "pending";
    await user.save();

    return sendSuccess(res, user, "KYC submitted successfully");
  } catch (error) {
    return sendError(res, error);
  }
};
