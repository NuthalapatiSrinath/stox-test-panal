import { validationResult } from "express-validator";
import User from "../../infrastructure/db/models/userModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { loggerMonitor } from "../../utils/logger.js";
import { upload } from "../../application/services/s3Upload.js";
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
    const { userId } = req.body;
    if (req.user.userId !== userId) {
      return sendResponse(
        res,
        HttpResponse.UNAUTHORIZED.code,
        "User ID mismatch with token",
        null,
        false
      );
    }
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
    if (
      user.fullName &&
      user.dateOfBirth &&
      user.gender &&
      user.documentType &&
      user.documentNumber &&
      user.kycVerifiedAt
    ) {
      return sendResponse(
        res,
        HttpResponse.ALREADY_EXISTS.code,
        HttpResponse.ALREADY_EXISTS.message
      );
    }
    const existingPan = await User.findOne({
      documentNumber,
      userId: { $ne: userId },
    });

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
    console.error("Error updating KYC info:", error);
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
  const uploadSingle = upload(process.env.S3_BUCKET_NAME).single(
    "documentImageUrl"
  );
  uploadSingle(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    try {
      const { userId } = req.body;
      console.log(req.file);
      if (req.user.userId !== userId) {
        return sendResponse(
          res,
          HttpResponse.UNAUTHORIZED.code,
          "User ID mismatch with token",
          null,
          false
        );
      }
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
        { documentImageUrl: documentImageUrl },
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
    console.error("Error updating KYC info:", error);
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
