import userModel from "../../infrastructure/db/Models/userModel.js";
import Wallet from "../../infrastructure/db/Models/walletModel.js";
import userEventModel from "../../infrastructure/db/Models/userEventModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";

export const handleCashfreeWebhook = async (req, res) => {
  try {
    const event = req.body?.event;

    if (event === "PAYMENT_SUCCESS_WEBHOOK") {
      const data = req.body.data;
      const orderId = data.order.order_id;
      const amount = data.order.order_amount;
      const userId = data.customer_details.customer_id;

      const user = await userModel.findOne({ userId });
      if (!user){
        return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message)
      }
      const existingTransaction = await Wallet.findOne({
        userId,
        "transactions.tnxId": orderId,
      });
      if (existingTransaction) {
        return res.status(200).send("Duplicate webhook: already processed");
      }
      const topUPMoney = await Wallet.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              transactionType: "top-up",
              amount,
              date: new Date(),
              tnxId: orderId,
              status: "success",
            },
          },
          $setOnInsert: { name: user.name },
        },
        { new: true, upsert: true }
      );

      user.walletBalance += amount;
      user.totalTopups += 1;
      await user.save();

      await userEventModel.create({
        userId,
        type: "wallet_topup",
        metadata: {
          amount,
          tnxId: orderId,
          balanceAfterTopup: user.walletBalance,
        },
      });
      return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message_4,topUPMoney)
    }
    return sendResponse(res,HttpResponse.BAD_GATEWAY.code,HttpResponse.BAD_GATEWAY.message);
  } catch (err) {
    console.log(err)
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
};
