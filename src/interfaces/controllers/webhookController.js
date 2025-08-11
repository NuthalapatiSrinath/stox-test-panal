import userModel from "../../infrastructure/db/Models/userModel.js";
import Wallet from "../../infrastructure/db/Models/walletModel.js";
import userEventModel from "../../infrastructure/db/Models/userEventModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";

export const handleCashfreeWebhook = async (req, res) => {
  try {
    const { order_id, order_amount, order_status, payment_id } = req.body;

    if (order_status !== "PAID") {
      return res.status(200).send("Ignored");
    }

    // Find user by order_id mapping (e.g., store orderId when initiating top-up)
    const paymentRecord = await PendingTopUp.findOne({ orderId: order_id });

    if (!paymentRecord || paymentRecord.status === "completed") {
      return res.status(200).send("Already processed");
    }

    const user = await userModel.findOne({ userId: paymentRecord.userId });

    // Update wallet
    await Wallet.findOneAndUpdate(
      { userId: user.userId },
      {
        $inc: { balance: +order_amount },
        $push: {
          transactions: {
            transactionType: "top-up",
            amount: order_amount,
            date: new Date(),
            tnxId: payment_id,
            status: "success",
          },
        },
        $setOnInsert: { name: user.name },
      },
      { new: true, upsert: true }
    );

    user.walletBalance += order_amount;
    user.totalTopups += order_amount;
    await user.save();

    // Mark top-up as completed
    paymentRecord.status = "completed";
    await paymentRecord.save();

    return res.status(200).send("Payment processed");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Webhook error");
  }
};

