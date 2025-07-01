import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import users from "../../infrastructure/db/models/userModel.js";
import { generateOtp, sendOtpEmail } from "../services/otpService.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { generateToken, verifyTokenFromRequest } from "../middlewares/auth.js";
import { loggerMonitor } from "../../utils/logger.js";
// @desc Register user and send OTP
export const registerUser = async (req, res) => {
  try {
    const { username, emailId, mobileNumber, password } = req.body;
    if (!username || !emailId || !mobileNumber || !password) {
      loggerMonitor.error(
        HttpResponse.ALL_FIELDS_REQUIRED.message,
        HttpResponse.ALL_FIELDS_REQUIRED.code
      );
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        HttpResponse.BAD_REQUEST.message,
        null,
        false
      );
    }
    const existingUser = await users.findOne({
      $or: [
        { emailId: emailId },
        { username: username },
        { mobileNumber: mobileNumber },
      ],
    });
    if (existingUser) {
      return sendResponse(
        res,
        HttpResponse.ALREADY_EXISTS.code,
        HttpResponse.ALREADY_EXISTS.message,
        null,
        false
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
      newUser,
      true
    );
  } catch (error) {
    loggerMonitor.error(
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      HttpResponse.INTERNAL_SERVER_ERROR.code
    );
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      null,
      false
    );
  }
};
//@desc Login
export const loginWithPassword = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if ((!emailId, !password)) {
      sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        HttpResponse.BAD_REQUEST.message,
        null,
        false
      );
    }
    const user = await users.findOne({ emailId });
    if (!user) {
      loggerMonitor.error(
        res,
        HttpResponse.BAD_REQUEST.message,
        HttpResponse.BAD_REQUEST.code
      );
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message,
        null,
        false
      );
    }
    if (!(await bcrypt.compare(password, user.password))) {
      sendResponse(
        res,
        HttpResponse.WRONG_PASSWORD.code,
        HttpResponse.WRONG_PASSWORD.message,
        null,
        false
      );
    }
    user.loginAttempts += 1;
    await user.save();
    if (user.isBlocked === true) {
      return sendResponse(
        res,
        HttpResponse.UNAUTHORIZED.code,
        HttpResponse.UNAUTHORIZED.message,
        null,
        false
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
      token,
      true
    );
  } catch (err) {
    loggerMonitor.error(
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      null,
      false,
      err
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
    user.otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000);
    user.otpLastSentAt = new Date();
    user.otpAttemptCount = 0;
    await sendOtpEmail(emailId, otp);
    await user.save();
    loggerMonitor.log("info", HttpResponse.OK.code, HttpResponse.OK.message);
    return sendResponse(res, HttpResponse.OK.code, HttpResponse.OK.message);
  } catch (err) {
    loggerMonitor.error(
      "info",
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
    console.log(err);
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
    const { emailId, otp } = req.body;

    const user = await users.findOne({ emailId });
    if (!user) {
      loggerMonitor.error(
        res,
        HttpResponse.BAD_REQUEST.message,
        HttpResponse.BAD_REQUEST.code
      );
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message
      );
    }
    if (user.otpAttemptCount >= 5) {
      return sendResponse(
        res,
        HttpResponse.FORBIDDEN.code,
        "Too many failed attempts. Please request a new OTP.",
        null,
        false
      );
    }
    if (user.otpExpiresAt < new Date()) {
      loggerMonitor.error(
        res,
        HttpResponse.BAD_REQUEST.message,
        HttpResponse.BAD_REQUEST.code
      );
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        "OTP has expired"
      );
    }
    if (!user.otpCode || !user.otpExpiresAt) {
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        "No OTP request found. Please request a new OTP.",
        null,
        false
      );
    }
    const isMatch = await bcrypt.compare(otp, user.otpCode);
    if (!isMatch) {
      user.otpAttemptCount += 1;
      await user.save();
      loggerMonitor.error(
        res,
        HttpResponse.UNAUTHORIZED.message,
        HttpResponse.UNAUTHORIZED.code
      );
      return sendResponse(res, HttpResponse.UNAUTHORIZED.code, "Invalid OTP");
    }
    user.otpCode = undefined;

    user.otpExpiresAt = undefined;
    user.otpAttemptCount = 0;
    user.isVerified = true;
    await user.save();
    const token = generateToken({
      userId: user.userId,
      role: user.role,
      email: user.emailId,
    });
    return sendResponse(
      res,
      HttpResponse.OK.code,
      "OTP verified successfully",
      token
    );
  } catch (err) {
    console.log(err);

    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
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
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      err.message
    );
  }
};
