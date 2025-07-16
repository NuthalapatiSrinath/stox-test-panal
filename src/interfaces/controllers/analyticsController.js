import userEventModel from '../../infrastructure/db/Models/userEventModel.js';
import { HttpResponse } from '../../utils/responses.js';
import { sendResponse } from '../middlewares/responseHandler.js';
import { sendEmail } from '../services/otpService.js';
export const notifyFullyEngagedUsers = async (req, res) => {
  try {
    const requiredEvents = ["user_login", "wallet_topup", "contest_joined", "wallet_withdraw"];
    const engagedUsers = await userEventModel.aggregate([
      {
        $group: {
          _id: "$userId",
          eventTypes: { $addToSet: "$type" },
        },
      },
      {
        $match: {
          eventTypes: { $all: requiredEvents },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "userId",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: "$userInfo.username",
          emailId: "$userInfo.emailId",
          mobileNumber: "$userInfo.mobileNumber",
          eventTypes: 1,
        },
      },
    ]);

    const results = [];

    for (const user of engagedUsers) {
      const message = `Hi ${user.username},\n\nYou're one of our most engaged users on Stox11 – you've done it all!\nWe appreciate your activity. Keep playing and winning! 🎉\n\n– Team Stox11`;

      try {
        await sendEmail(user.emailId, "🔥 You're Fully Active on Stox11!", message);
        results.push({ ...user, emailStatus: "Sent" });
      } catch (error) {
        results.push({ ...user, emailStatus: `Failed: ${error.message}` });
      }
    }
    return sendResponse(res,HttpResponse.NOTIFIED.code,HttpResponse.NOTIFIED.message,{results})
  } catch (err) {
    console.error("Error notifying fully engaged users:", err);
    return sendResponse(res,HttpResponse.NOTIFICATION_FAILED.code,HttpResponse.NOTIFICATION_FAILED.code,{error});
  }
};
export const notifyLeastEngagedUsers = async (req, res) => {
  try {
    const result = await userEventModel.aggregate([
      {
        $group: {
          _id: "$userId",
          eventTypes: { $addToSet: "$type" }, 
        },
      },
      {
        $project: {
          userId: "$_id",
          eventTypes: 1,
          eventCount: { $size: "$eventTypes" },
        },
      },
      {
        $match: {
          eventCount: { $lt: 3 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "userId",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          userId: 1,
          eventTypes: 1,
          username: "$userInfo.username",
          emailId: "$userInfo.emailId",
          mobileNumber: "$userInfo.mobileNumber",
        },
      },
    ]);
    const responses = [];
    for (const user of result) {
      const message = `Hi ${user.username},\n\nWe noticed you're not using all the awesome features of Stox11 yet.\nCreate your dream team, join contests, and win real money!\n\n– Team Stox11`;

      try {
        await sendEmail(user.emailId, "You're Missing Out on Stox11!", message);
        responses.push({ ...user, emailStatus: "Sent" });
      } catch (err) {
        responses.push({ ...user, emailStatus: `Failed: ${err.message}` });
      }
    }
    return sendResponse(res,HttpResponse.NOTIFIED.code,HttpResponse.NOTIFIED.message,{responses})
  } catch (err) {
    console.error("Error notifying least engaged users:", err);
    return sendResponse(res,HttpResponse.NOTIFICATION_FAILED.code,HttpResponse.NOTIFICATION_FAILED.message,{error});
  }
};
export const notifyMissedJoinUsers = async (req, res) => {
  try {
    const missedUsers = await userEventModel.aggregate([
      { $match: { type: "contest_join_missed" } },
      {
        $group: {
          _id: "$userId",
          missedContests: { $addToSet: "$metadata.contestId" },
          totalMissed: { $sum: 1 },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "userId",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          userId: "$_id",
          username: "$userInfo.username",
          emailId: "$userInfo.emailId",
          mobileNumber: "$userInfo.mobileNumber",
          missedContests: 1,
          totalMissed: 1
        }
      }
    ]);

    const results = [];

    for (const user of missedUsers) {
      const message = `Hey ${user.username},\n\nLooks like you tried to join ${user.totalMissed} contest(s) but didn’t finish. Join the next one now — you’re just one step away from winning! 🏆\n\n– Team Stox11`;

      try {
        await sendEmail(user.emailId, "🏁 You almost joined — don’t stop now!", message);
        results.push({ ...user, emailStatus: "Sent" });
      } catch (err) {
        results.push({ ...user, emailStatus: `Failed: ${err.message}` });
      }
    }

    return res.status(200).json({
      message: "Missed join users notified",
      data: results
    });

  } catch (err) {
    console.error("notifyMissedJoinUsers error:", err);
    return res.status(500).json({
      message: "Internal error",
      error: err.message
    });
  }
};