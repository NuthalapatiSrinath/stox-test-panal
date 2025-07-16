import Team from "../../infrastructure/db/Models/teamModel.js";
import User from "../../infrastructure/db/Models/userModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import Contest from "../../infrastructure/db/Models/contestModel.js";
import { v4 as uuidv4 } from "uuid";
import userEventModel from "../../infrastructure/db/Models/userEventModel.js";
export const joinContestWithTeam = async (req, res) => {
  try {
    const { userId, contestId, selectedStocks } = req.body;
    if (!Array.isArray(selectedStocks) || selectedStocks.length !== 10) {
      return sendResponse(
        res,
        HttpResponse.BAD_GATEWAY.code,
        HttpResponse.BAD_GATEWAY.message_2
      );
    }
    const user = await User.findOne({ userId });
    if (!user) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message
      );
    }
    const contest = await Contest.findOne({ contestId });
    if (!contest) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message_2
      );
    }
    if (user.joinedContests.some((entry) => entry.contestId === contestId)) {
      return sendResponse(
        res,
        HttpResponse.ALREADY_EXISTS.code,
        HttpResponse.ALREADY_EXISTS.message_2
      );
    }
    const entryFee = contest.entryFee;
    if (user.walletBalance < entryFee) {
      await userEventModel.create({
        userId,
        type: "contest_join_missed",
        metadata: {
          contestId,
          reason: "low_balance",
          timestamp: new Date(),
        },
      });
      return sendResponse(
        res,
        HttpResponse.LOW_BALANCE.code,
        HttpResponse.LOW_BALANCE.message
      );
    }
    const teamId = uuidv4();
    const newTeam = await Team.create({
      teamId,
      userId,
      contestId,
      selectedStocks,
    });
    contest.spotsLeft -= 1;
    await contest.save();
    user.walletBalance -= entryFee;
    user.joinedContests.push({ contestId, teamId });
    user.joinedContestIds.push(contestId);
    await user.save();
    await userEventModel.create({
      userId,
      type: "contest_joined",
      metadata: {
        contestId,
        teamId,
        entryFee,
        stocksSelected: selectedStocks.length,
      },
    });

    return sendResponse(
      res,
      HttpResponse.CREATED.code,
      HttpResponse.CREATED.message_2,
      { newTeam }
    );
  } catch (error) {
    console.log(error);
    return sendResponse(res, HttpResponse.INTERNAL_SERVER_ERROR.code, error);
  }
};
