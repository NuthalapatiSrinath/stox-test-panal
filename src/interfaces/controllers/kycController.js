import { validationResult } from "express-validator";
import User from "../../infrastructure/db/models/userModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { loggerMonitor } from "../../utils/logger.js";
import { upload } from "../../application/services/s3Upload.js";
import { extractPanFromTextract } from "../../application/services/extractText.js";
import { KYC_STATUS } from "../../domain/constants/enums.js";
export const updateKycInfo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    loggerMonitor.error(
      "info",
      HttpResponse.BAD_GATEWAY.code,
      HttpResponse.BAD_GATEWAY.message
    );
    return sendResponse(
      res,
      HttpResponse.BAD_GATEWAY.code,
      HttpResponse.BAD_GATEWAY.message
    );
  }
  try {
    const userId = req.user.userId; 
    const { fullName, dateOfBirth, gender, documentType, documentNumber } =
      req.body;
    const user = await User.findOne({ userId });
    if (!user) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message,
        null,
        false
      );
    }
    // if (
    //   user.fullName &&
    //   user.dateOfBirth &&
    //   user.gender &&
    //   user.documentType &&
    //   user.documentNumber &&
    //   user.kycVerifiedAt
    // ) {
    //   return sendResponse(
    //     res,
    //     HttpResponse.ALREADY_EXISTS.code,
    //     HttpResponse.ALREADY_EXISTS.message
    //   );
    // }
    const existingPan = await User.findOne({
      documentNumber    });

    if (existingPan) {
      return sendResponse(
        res,
        HttpResponse.ALREADY_EXISTS.code,
        HttpResponse.ALREADY_EXISTS.message,
        null,
        false
      );
    }
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { 
        fullName,
        dateOfBirth,
        gender,
        documentType,
        documentNumber,
        kycVerifiedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      loggerMonitor.error(
        "info",
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message
      );
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message
      );
    }
    loggerMonitor.log("info", HttpResponse.OK.code, HttpResponse.OK.message);
    return sendResponse(res, HttpResponse.OK.code, HttpResponse.OK.message,updatedUser);
  } catch (error) {
    console.error(error);
    loggerMonitor.error(
      "info",
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
export const uploadDocumentUrl = (req, res) => {
  const uploadSingle = upload(process.env.S3_BUCKET_NAME).single("documentImageUrl");

  uploadSingle(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const userId = req.user?.userId; 

      if (!req.file) {
        return sendResponse(
          res,
          HttpResponse.FORBIDDEN.code,
          HttpResponse.FORBIDDEN.message
        );
      }

      const documentImageUrl = req.file.location;

      const updatedKyc = await User.findOneAndUpdate(
        { userId },
        { documentImageUrl },
        { new: true }
      );

      if (!updatedKyc) {
        return sendResponse(
          res,
          HttpResponse.NOT_FOUND.code,
          HttpResponse.NOT_FOUND.message
        );
      }

      return sendResponse(
        res,
        HttpResponse.OK.code,
        HttpResponse.OK.message,
        updatedKyc
      );

    } catch (dbError) {
      console.error(dbError);
      return sendResponse(
        res,
        HttpResponse.INTERNAL_SERVER_ERROR.code,
        HttpResponse.INTERNAL_SERVER_ERROR.message,
        dbError
      );
    }
  });
};
export const getPendingKycUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ kycStatus: "pending" }).select(
      "fullName email documentType documentNumber kycStatus createdAt"
    );
    loggerMonitor.log("info", HttpResponse.OK.code, HttpResponse.OK.message);
    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      pendingUsers
    );
  } catch (error) {
    console.error(error);
    loggerMonitor.error(
      "info",
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
export const extractPanController = async (req, res) => {
  try {
    if (!req.file || !req.file.bucket || !req.file.key) {
      return sendResponse(res,HttpResponse.BAD_REQUEST.code,HttpResponse.BAD_REQUEST.message)
    }
    const { bucket, key } = req.file;
    const result = await extractPanFromTextract(bucket, key);
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,result)
  } catch (error) {
    console.error(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,error.message)
  }
};
export const updateKycStatus = async(req,res)=>{
  try{
  const {userId,kycStatus,kycRejectionReason} = req.body;
  if (!userId || !kycStatus) {
    return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
  }
  const allowStatuses = Object.values(KYC_STATUS);
  if(!allowStatuses.includes(kycStatus)){
    return sendResponse(res,HttpResponse.INVALID_KYC_STATUS.code,HttpResponse.INVALID_KYC_STATUS.message);
  }
  if(kycStatus===KYC_STATUS.REJECTED && !kycRejectionReason){
    return sendResponse(res,HttpResponse.REJECTION_REASON_REQUIRED.code,HttpResponse.REJECTION_REASON_REQUIRED.message);
  }
  const updateFields = {
    kycStatus,
    kycRejectionReason: kycStatus === KYC_STATUS.REJECTED ? kycRejectionReason : null,
  };
  const updatedUser = await User.findOneAndUpdate({userId},updateFields,{new:true});
    if (!updatedUser) {
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message)
    }
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,updatedUser);
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message)
  }
};
export const getKycDetails = async(req,res)=>{
  try{
    const getAllKycDetails = await User.find({},"userId fullName username mobileNumber documentNumber dateOfBirth documentImageUrl kycStatus kycRejectionReason");
    if(!getAllKycDetails){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message);
    }
    const formattedKyc = getAllKycDetails.map(kyc=>({
      userId:kyc.userId,
      fullName:kyc.fullName,
      username:kyc.username,
      mobileNumber:kyc.mobileNumber,
      documentNumber:kyc.documentNumber,
      dateOfBirth:kyc.dateOfBirth,
      documentImageUrl:kyc.documentImageUrl,
      kycStatus:kyc.kycStatus,
      kycRejectionReason:kyc.kycRejectionReason
    }))
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{formattedKyc});
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
};