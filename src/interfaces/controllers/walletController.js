import Wallet from "../../infrastructure/db/Models/walletModel.js";
import userModel from "../../infrastructure/db/Models/userModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { v4 as uuidv4 } from "uuid";
import userEventModel from "../../infrastructure/db/Models/userEventModel.js";
import axios from "axios";

export const getTransactionDetails = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }
    const transaction = await Wallet.findOne({ userId });
    if (!transaction) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message_3
      );
    }
    return sendResponse(res, HttpResponse.OK.code, HttpResponse.OK.message, {
      transaction,
    });
  } catch (error) {
    console.log(error);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
export const topUpWallet = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    if (amount < 50) {
      return sendResponse(res, 422, "Minimum top-up amount is ₹50.");
    }
    const user = await userModel.findOne({ userId });
    if (!user) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message
      );
    }
    if (user.walletLocked) return sendResponse(res, 403, "Wallet is locked.");
    const topUpMoney = await Wallet.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: +amount },
        $push: {
          transactions: {
            transactionType: "top-up",
            amount,
            date: new Date(),
            tnxId: uuidv4(),
            status: "success",
          },
        },
         $setOnInsert: {
         name:user.name
    },
      },
      { new: true,upsert:true }
    );
   user.walletBalance += amount;
   user.totalTopups +=1; 
   await user.save();
   await userEventModel.create({
    userId,
    type: "Topup_Wallet",
    metadata: {
      amount,
      tnxId: uuidv4(),
      balanceAfterWithdraw: user.walletBalance,
  },
});
  return sendResponse(res,HttpResponse.OK.code, "Payment order created",{topUpMoney});
  } catch (err) {
    console.error(err.message);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message, err.message);
  }
};
export const withdrawWallet = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }
    if (amount < 100) {
      return sendResponse(
        res,
        HttpResponse.UNPROCESSABLE_ENTITY.code,
        HttpResponse.UNPROCESSABLE_ENTITY.message_3
      );
    }
    const user = await userModel.findOne({ userId });
    if (!user) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message
      );
    }
    if (user.walletBalance < amount) {
      return sendResponse(
        res,
        HttpResponse.LOW_BALANCE.code,
        HttpResponse.LOW_BALANCE.message
      );
    }
    if (user.walletLocked === true) {
      return sendResponse(
        res,
        HttpResponse.FORBIDDEN.code,
        HttpResponse.FORBIDDEN.message_3
      );
    }
    if(user.kycStatus!=="approved"){
      return sendResponse(res,HttpResponse.COMPLETE_KYC.code,HttpResponse.COMPLETE_KYC.message)
    }
    const withdrawMoney = await Wallet.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: -amount },
        $push: {
          transactions: {
            transactionType: "withdraw",
            amount,
            date: new Date(),
            tnxId: uuidv4(),
            status: "success",
          },
        },
         $setOnInsert: {
         name:user.name
    },
      },
      { new: true }
    );
    user.walletBalance -= amount;
    user.totalEarnings += amount;
    await user.save();
    await userEventModel.create({
    userId,
    type: "wallet_withdraw",
    metadata: {
      amount,
      tnxId: uuidv4(),
      balanceAfterWithdraw: user.walletBalance,
  },
});
    return sendResponse(res, HttpResponse.OK.code, HttpResponse.OK.message, {
      withdrawMoney,
    });
  } catch (error) {
    console.log(error);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
export const getAllTransactions = async (req, res) => {
  try {
    const allTransactions = await Wallet.find().select("userId transactions name ");
    return sendResponse(res, HttpResponse.OK.code, { allTransactions });
  } catch (error) {
    console.log(error);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      { error }
    );
  }
};