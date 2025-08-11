import moment from "moment";
import userModel from "../../infrastructure/db/Models/userModel.js";

export const handleDailyEngagement = async (userId) => {
  const user = await userModel.findOne({ userId });
  if (!user) return;

  const today = moment().startOf("day");
  const lastEngaged = user.lastEngagementDate
    ? moment(user.lastEngagementDate).startOf("day")
    : null;

  if (!lastEngaged || lastEngaged.isBefore(today)) {
    user.engagementScore = (user.engagementScore || 0) + 10;
    user.lastEngagementDate = new Date();
    await user.save();
  }
};


export const updateContestEngagementPoints = async (userId) => {
  const user = await userModel.findOne({ userId });
  if (!user) return;

  // Add 15 points for current join
  user.engagementScore = (user.engagementScore || 0) + 15;

  const today = moment().startOf("day");

  // Count contests joined today (including the current one)
  const contestsToday = (user.joinedContests || []).filter((entry) =>
    moment(entry.joinedAt).isSame(today, "day")
  );

  // ✅ If this is the 21st contest today, give bonus +10
  if (contestsToday.length === 21) {
    user.engagementScore += 10;
  }

  await user.save();
};

export const addTopUpEngagementPoints = async (userId, points = 20) => {
  try {
    const user = await userModel.findOne({ userId });
    if (!user) return;

    user.engagementScore = (user.engagementScore || 0) + points;
    await user.save();
    console.log(`+${points} engagement points added for top-up to user: ${userId}`);
  } catch (err) {
    console.error("Error adding top-up engagement points:", err.message);
  }
};

