import bcrypt from "bcryptjs";
import adminModel from "../../infrastructure/db/Models/adminModel.js";
import { generateToken, verifyTokenFromRequest } from "../middlewares/auth.js";
import { HttpResponse } from "../../utils/responses.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { uploadProfileImage } from "../../application/services/s3Upload.js";
import WithdrawRequest from "../../infrastructure/db/Models/WithdrawRequest.js"; 
import userModel from "../../infrastructure/db/Models/userModel.js";
import Wallet from "../../infrastructure/db/Models/walletModel.js";
import userEventModel from "../../infrastructure/db/Models/userEventModel.js";
import { v4 as uuidv4 } from "uuid";
import { WITHDRAWREQUESTRESULT } from "../../domain/constants/enums.js";
export const addAdmin = async (req, res) => {
  try {
    const { mailId, password, profileImage,role } = req.body;

    if (!mailId || !password || !role) {
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        "Username and password are required",
        null,
        false
      );
    }

    const existingAdmin = await adminModel.findOne({ mailId });
    if (existingAdmin) {
      return sendResponse(
        res,HttpResponse.ALREADY_EXISTS.code,HttpResponse.ALREADY_EXISTS.message
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10); 
    const newAdmin = new adminModel({
      mailId,
      password:hashedPassword,
      role,
      profileImage
    });

    await newAdmin.save();

    return sendResponse(
      res,
      HttpResponse.CREATED.code,
      "Admin created successfully",
      {
        mailId: newAdmin.mailId,
        id: newAdmin._id
      },
      true
    );
  } catch (err) {
    console.log(err)
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      err
    );
  }
};
export const adminLoginWithPassword = async (req, res) => {
  try {
    const { mailId, password } = req.body;
    if (!mailId || !password) {
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        HttpResponse.BAD_REQUEST.message
      );
    }
    const admin = await adminModel.findOne({ mailId });
    if (!admin) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_6
      );
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return sendResponse(
        res,
        HttpResponse.WRONG_PASSWORD.code,
        HttpResponse.WRONG_PASSWORD.message,
        null,
        false
      );
    }
    admin.logs.push({
      activity: `${admin.role} logged in`,
      timestamp: new Date(),
    });
    admin.lastLoginAt = new Date();
    await admin.save();
    const token = generateToken({
      adminId: admin.adminId,
      role:admin.role,
      mailId: admin.mailId,
    });
    return sendResponse(
      res,
      HttpResponse.OK.code,
      "Admin login successful",
      token,
      true
    );
  } catch (err) {
    console.log(err);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      err
    );
  }
};
export const getAdmin = async(req,res)=>{
    try{
        const decoded = verifyTokenFromRequest(req);
        const { adminId } = decoded;
        console.log(adminId)
        const admin = await adminModel.findOne({adminId});
        if(!admin){
            return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_6);
        }
        return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{admin});
    }catch(error){
        console.log(error);
        return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,error.message)
    }
};
export const changeAdminPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return sendResponse(
        res,
        HttpResponse.BAD_REQUEST.code,
        "Old and new passwords are required",
        null,
        false
      );
    }
    const admin = await adminModel.findOne({adminId:req.admin.adminId});
    if (!admin) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        "Admin not found",
        null,
        false
      );
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return sendResponse(
        res,
        HttpResponse.UNAUTHORIZED.code,
        "Old password is incorrect"
      );
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    admin.logs.push({
      activity: "Changed password",
      timestamp: new Date()
    });
    await admin.save();
    return sendResponse(
      res,
      HttpResponse.OK.code,
      "Password updated successfully",
      null,
      true
    );
  } catch (err) {
    console.log(err);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,      
      err
    );
  }
};
export const uploadAdminProfile = async (req,res)=>{
  const uploadSingle = uploadProfileImage(process.env.S3_BUCKET_NAME).single("profilePicture");
    uploadSingle(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      try {
        const {adminId} = req.body;
        if (!adminId) {
          return sendResponse(
            res,
            HttpResponse.ALL_FIELDS_RUIRED.code,
            HttpResponse.ALL_FIELDS_REQUIRED.message
          );
        }
      const profilePicture = req.file?.location || null;
      const updateProfilePic = await adminModel.findOneAndUpdate({adminId},{profilePicture});
      if(!updateProfilePic){
        return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message);
      }
      return sendResponse(res,HttpResponse.UPDATED.code,HttpResponse.UPDATED.message,{updateProfilePic});
      } catch (error) {
        console.error(error);
        return sendResponse(
          res,
          HttpResponse.INTERNAL_SERVER_ERROR.code,
          HttpResponse.INTERNAL_SERVER_ERROR.message,
          error
        );
      }
    });
};
export const handleAdminWithdrawAction = async (req, res) => {
  try {
    const { withDrawRequestId, action } = req.body;
    if (!withDrawRequestId || !action) {
      return sendResponse(res, HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const request = await WithdrawRequest.findOne({ withDrawRequestId });
    if (!request || request.status !== WITHDRAWREQUESTRESULT.PENDING) {
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_7);
    }
    const user = await userModel.findOne({ userId: request.userId });
    if (!user) {
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message);
    }
    if (action === WITHDRAWREQUESTRESULT.DENIED) {
      request.status = WITHDRAWREQUESTRESULT.DENIED;
      request.updatedAt = new Date();
      await request.save();
      return sendResponse(res, HttpResponse.OK.code, HttpResponse.OK.message_6);
    }
    if (user.walletBalance < request.amount) {
      return sendResponse(res,HttpResponse.LOW_BALANCE.code,HttpResponse.LOW_BALANCE.message);
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId: user.userId },
      {
        $inc: { balance: -request.amount },
        $push: {
          transactions: {
            transactionType: "withdraw",
            amount: request.amount,
            date: new Date(),
            tnxId: uuidv4(),
            status: "success",
          },
        },
      },
      { new: true }
    );

    user.walletBalance -= request.amount;
    user.totalEarnings += request.amount;
    await user.save();

    request.status = WITHDRAWREQUESTRESULT.ACCEPTED;
    request.updatedAt = new Date();
    await request.save();

    await userEventModel.create({
      userId: user.userId,
      type: "wallet_withdraw",
      metadata: {
        amount: request.amount,
        tnxId: uuidv4(),
        balanceAfterWithdraw: user.walletBalance,
      },
    });

    return sendResponse(res, HttpResponse.CREATED.code,HttpResponse.CREATED.message_3, {
      wallet,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message,error.message);
  }
};
export const getPendingWithdrawalRequestsByDate = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const from = fromDate ? new Date(fromDate) : new Date("1970-01-01");
    const to = toDate
      ? new Date(new Date(toDate).setHours(23, 59, 59, 999))
      : new Date();

    const requests = await WithdrawRequest.find({
      status: "pending",
      createdAt: { $gte: from, $lte: to },
    }).sort({ createdAt: -1 });

    const enriched = await Promise.all(
      requests.map(async (req) => {
        const user = await userModel.findOne({ userId: req.userId });
        return {
          withDrawRequestId: req.withDrawRequestId,
          userId: req.userId,
          name: user?.name || "Unknown",
          username: user?.username || "",
          mobileNumber: user?.mobileNumber || "",
          amount: req.amount,
          createdAt: req.createdAt,
        };
      })
    );

    return sendResponse(res, 200, "Pending withdrawal requests", enriched);
  } catch (error) {
    console.error("getPendingWithdrawalRequestsByDate error:", error);
    return sendResponse(res, 500, "Failed to fetch pending withdrawal requests", error.message);
  }
};
export const getPendingRequests = async(req,res)=>{
  try{
    const pendingList = await WithdrawRequest.find({status:'pending'});
    if(!pendingList){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,"No pending List found");
    }
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{pendingList})
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
}