import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import users from "../../infrastructure/db/models/userModel.js";
import { generateOtp, sendOtpEmail } from "../services/otpService.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { generateToken, verifyTokenFromRequest } from "../middlewares/auth.js";
import { loggerMonitor } from "../../utils/logger.js";
import redisClient from "../../infrastructure/redis/index.js";
import otpQueue from "../../infrastructure/queues/emailOtpQueue.js";
import userEventModel from "../../infrastructure/db/Models/userEventModel.js";
import contestModel from "../../infrastructure/db/Models/contestModel.js";

export const registerUser = async (req, res) => {
  try {
    const { name,username, emailId, mobileNumber, password } = req.body;
    if (!name||!username || !emailId || !mobileNumber || !password) {
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
      name,
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
        HttpResponse.WRONG_PASSWORD.message
      );
    }
    user.loginAttempts += 1;
    await user.save();
    if (user.isBlocked === true) {
      return sendResponse(
        res,
        HttpResponse.UNAUTHORIZED.code,
        HttpResponse.UNAUTHORIZED.message_3
      );
    }
    user.lastLoginAt = new Date();
    user.loginAttempts = 0;
    user.isVerified = true;
    await user.save();
    await userEventModel.create({
      userId: user.userId,
      type: "user_login",
      metadata: {
        email: user.emailId,
        device: req.headers["user-agent"] || "unknown",
        ip: req.ip,
      },
    });
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
    user.otpExpiresAt = new Date(Date.now() + 3 * 60 * 1000);
    user.otpLastSentAt = new Date();
    user.otpAttemptCount = 0;
    await otpQueue.add({emailId, otp});
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
        HttpResponse.FORBIDDEN.message_2,
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
        HttpResponse.BAD_REQUEST.message_2
      );
    }
    if (!user.otpCode || !user.otpExpiresAt) {
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        HttpResponse.BAD_REQUEST.meesage_3,
        null,
        false
      );
    }
    if (user.isBlocked === true) {
      return sendResponse(
        res,
        HttpResponse.UNAUTHORIZED.code,
        HttpResponse.UNAUTHORIZED.message_3,
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
      return sendResponse(
        res,
        HttpResponse.UNAUTHORIZED.code,
        HttpResponse.UNAUTHORIZED.message_4
      );
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
      HttpResponse.OK.message_2,
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
    const cacheKey = `user:${userId}`;
    const cachedUser = await redisClient.get(cacheKey);
    if (cachedUser) {
      console.log('User served from Redis cache');
      return sendResponse(
        res,
        HttpResponse.OK.code,
        HttpResponse.OK.message,
        JSON.parse(cachedUser)
      );
    }
    const user = await users
      .findOne({ userId })
      .select(
        '-password -otpCode -otpExpiresAt -otpAttemptCount -otpLastSentAt -documentImageUrl'
      );
    if (!user) {
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        HttpResponse.BAD_REQUEST.message
      );
    }
    await redisClient.setEx(cacheKey, 60 * 10, JSON.stringify(user)); 
    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      user
    );
  } catch (err) {
    console.error('getUserByToken error:', err.message);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      err.message
    );
  }
};
export const getUserForAdmin = async(req,res)=>{
  try{
     const {userId} = req.body;
     if(!userId){
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
     }
     const user = await users.findOne({userId});
     if(!user){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message)
     }
     return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,user)
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message)
  }
}
export const getAllUsersForAdminDashboard = async (req, res) => {
  try {
    const Users = await users.find({}, "userId name username emailId mobileNumber joinedContestIds");

    const formatted = Users.map(user => ({
      userId:user.userId,
      username: user.username,
      emailId: user.emailId,
      mobileNumber: user.mobileNumber,
      contestsPlayed: user.joinedContestIds.length
    }));

    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      formatted
    );
  } catch (err) {

    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      err
    );
  }
};
export const getUsersForAdminUserManagement = async(req,res)=>{
  try{
     const Users = await users.find({}, "userId name username emailId mobileNumber createdAt walletBalance isActive");
     const formatted = Users.map(user => ({
      userId:user.userId,
      name:user.name,
      fullName:user.fullName,
      username: user.username,
      emailId: user.emailId,
      mobileNumber: user.mobileNumber,
      createdAt:user.createdAt,
      walletBalance:user.walletBalance,
      isActive:user.isActive
    }))
      return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      formatted
    );
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message,error)
  }
}
export const updateWalletAndActive = async(req,res)=>{
  try{
     const {userId,walletBalance,isActive}= req.body;
     const updatedData = {};
     if(walletBalance !== undefined){
        updatedData.walletBalance = walletBalance
     }
     if(isActive!==undefined){
      updatedData.isActive =isActive
     }
       const updatedUser = await users.findOneAndUpdate(
      { userId },
      { $set: updatedData },
      { new: true }
    ).select("userId username emailId walletBalance isActive");
       if (!updatedUser) {
      loggerMonitor.error()
      return sendResponse(res, HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message);
    }
    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      updatedUser
    );
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,error)
  }
}
export const setUserOnline = async (userId) => {
  if (!userId) return;
  await users.findOneAndUpdate(
    { userId },
    { isActive:true }
  );
};
export const setUserOffline = async (userId) => {
  if (!userId) return;
  await users.findOneAndUpdate(
    { userId },
    { isActive:false }
  );
}
export const filterActiveAndInactiveUsers = async(req,res)=>{
  try{
    const {isActive} = req.body;
    const getUser = await users.find({isActive});
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,getUser)
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
}
export const participationHistory = async(req,res)=>{
  try{
    const {userId}= req.body;
    const user = await users.findOne({ userId });
    if(!user){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message);
    }
    if (!user.joinedContests || user.joinedContests.length === 0) {
      return sendResponse(res,HttpResponse.NO_PARTICIPATION.code,HttpResponse.NO_PARTICIPATION.message);
    }
    const contestIds = await user.joinedContests.map(jc=>jc.contestId);
    console.log(contestIds);
    const contests = await contestModel.find({contestId:{$in: contestIds}});
    console.log(contests);
    const history = contests.map(c=>({
      contestType:c.contestType,
      entryFee:c.entryFee,
      hourType:c.hourType,
      date:Date().toString()
    }))
    console.log(history);
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{history}
    )
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message,error);
  }
}