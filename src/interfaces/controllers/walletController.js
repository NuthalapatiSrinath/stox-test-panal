import Wallet from "../../infrastructure/db/Models/walletModel.js";
import userModel from "../../infrastructure/db/Models/userModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { v4 as uuidv4 } from "uuid";
import userEventModel from "../../infrastructure/db/Models/userEventModel.js";
import axios from "axios";
import { createCashfreeOrder } from "../../application/services/cashFree.js";
import WithdrawRequest from "../../infrastructure/db/Models/WithdrawRequest.js"; 
import { addTopUpEngagementPoints } from "../../application/services/engagement.js";
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
   user.totalTopups +=amount; 
   console.log(user.userId)
   await addTopUpEngagementPoints(user.userId);
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


const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_BASE_URL =  "https://sandbox.cashfree.com/pg"; // Use prod URL in production

// export const topUpWalletWithCashfree = async (req, res) => {
//   try {
//     const { userId, amount } = req.body;

//     if (!userId || !amount) {
//       return sendResponse(res, 400, "All fields required");
//     }
//     if (amount < 50) {
//       return sendResponse(res, 422, "Minimum top-up amount is ₹50");
//     }

//     const user = await userModel.findOne({ userId });
//     if (!user) return sendResponse(res, 404, "User not found");
//     if (user.walletLocked) return sendResponse(res, 403, "Wallet is locked");

//     const orderId = uuidv4();

//     const headers = {
//       "Content-Type": "application/json",
//       "x-client-id": CASHFREE_APP_ID,
//       "x-client-secret": CASHFREE_SECRET_KEY,
//       "x-api-version": "2022-09-01",
//     };

//     const payload = {
//       order_id: orderId,
//       order_amount: amount,
//       order_currency: "INR",
//       customer_details: {
//         customer_id: userId,
//         customer_name: user.name,
//         customer_email: user.email || "no-reply@yourapp.com",
//         customer_phone: user.mobileNumber || "9999999999",
//       },
//       order_meta: {
//         notify_url: `http://localhost:8080/api/webhook/cashfree`,
//         return_url: `https://yourapp.com/payment-success?order_id=${orderId}`,
//       },
//       payment_methods: ["upi"],
//     };

//     const cfRes = await axios.post(`${CASHFREE_BASE_URL}/orders`, payload, {
//       headers,
//     });

//     const { order_id, payments } = cfRes.data;
// const paymentLink = payments?.url;

// if (!paymentLink) {
//   return sendResponse(res, 500, "Payment link not returned from Cashfree", cfRes.data);
// }

// return sendResponse(res, 200, "Top-up order created", {
//   orderId: order_id,
//   paymentLink: paymentLink,
// });

//   } catch (error) {
//     console.error("topUpWalletWithCashfree:", error.response?.data || error);
//     return sendResponse(
//       res,
//       500,
//       "Failed to create top-up payment",
//       error.response?.data || error.message
//     );
//   }
// };

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

    if (user.kycStatus !== "approved") {
      return sendResponse(
        res,
        HttpResponse.COMPLETE_KYC.code,
        HttpResponse.COMPLETE_KYC.message
      );
    }

    if (amount >= 10000) {
      await WithdrawRequest.create({
        userId,
        username: user.username,
        name: user.name,
        amount,
        status: "pending" 
      });

      return sendResponse(
        res,
        HttpResponse.OK.code,
        "Withdrawal request sent to admin for approval."
      );
    }

    // ✅ Auto process withdrawal ≤ 10000
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
          name: user.name,
        },
      },
      { new: true, upsert: true }
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