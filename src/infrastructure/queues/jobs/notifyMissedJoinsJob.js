import dotenv from "dotenv";
import userEventModel from "../../db/Models/userEventModel.js";
import { sendEmail } from "../../../interfaces/services/otpService.js";

dotenv.config();

export const runMissedJoinJob = async () => {
  console.log("🔁 Running missed join notification job...");
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 10);
  const missedUsers = await userEventModel.aggregate([
    {
      $match: {
        type: "contest_join_missed",
        "metadata.timestamp": { $gte: oneHourAgo },
      },
    },
    {
      $group: {
        _id: "$userId",
        missedContests: { $addToSet: "$metadata.contestId" },
        totalMissed: { $sum: 1 },
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
        userId: "$_id",
        username: "$userInfo.username",
        emailId: "$userInfo.emailId",
        missedContests: 1,
        totalMissed: 1,
      },
    },
  ]);

  for (const user of missedUsers) {
    const message = `Hey ${user.username},\n\nYou tried to join ${user.totalMissed} contest(s) but didn’t complete it. Jump back in — your dream team awaits! 🏏\n\n– Team Stox11`;
    try {
      await sendEmail(user.emailId, "⚠️ You missed a contest!", message);
      await userEventModel.deleteMany({
        userId: user.userId,
        type: "contest_join_missed",
        "metadata.contestId": { $in: user.missedContests },
      });
      console.log(`Email sent to ${user.emailId}`);
    } catch (err) {
      console.error(`Email failed for ${user.emailId}: ${err.message}`);
    }
  }
  console.log(" Missed join job finished.");
};

if (process.argv[1].includes("notifyMissedJoinsJob.js")) {
  runMissedJoinJob().then(() => process.exit());
}
