import {contest} from "../../infrastructure/db/Models/contestModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { normalizeTime } from "../middlewares/normalization.js";
import redisClient from '../../infrastructure/redis/index.js';

export const addContest = async (req, res) => {
  try {
    const contestData = req.body;

    if (!contestData) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }

    const createdContest = await contest.create(contestData);
    console.log("Created contest:", createdContest);

    const categoryTitle = createdContest.categoryTitle;
    const startTime = createdContest.timeSlot?.startTime;

    await redisClient.del(`contest:${categoryTitle}`);
    if (startTime) {
      await redisClient.del(`contest:${categoryTitle}:${startTime}`);
    }

    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      createdContest
    );
  } catch (error) {
    console.error("Error creating contest:", error.message);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      error.message
    );
  }
}; 
export const getContestsByCategoryTitle = async (req, res) => {
  try {
    const { categoryTitle, time } = req.body;

    if (!categoryTitle) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }
    const cacheTitle = time
      ? `contest:${categoryTitle}:${time}`
      : `contest:${categoryTitle}`;

    const cachedContest = await redisClient.get(cacheTitle);
    if (cachedContest) {
      console.log('Contest served from Redis cache');
      return sendResponse(
        res,
        HttpResponse.OK.code,
        HttpResponse.OK.message,
        JSON.parse(cachedContest)
      );
    }

    const query = {
      categoryTitle: new RegExp(`^${categoryTitle}$`, "i"),
    };

    if (time && categoryTitle.toLowerCase() === "intra day") {
      query["timeSlot.startTime"] = normalizeTime(time);
    }

    const contests = await contest.find(query).sort({ createdAt: -1 });

    const transformed = contests.map(c => ({
      pricePool: c.pricePool,
      entryFee: c.entryFee,
      spotsLeft: c.spotsLeft,
      totalSpots: c.spots,
      winAmount: c.winAmount,
      contestType: c.contestType,
      winningPercentage: c.winningPercentage,
      startTime: c.timeSlot?.startTime && c.timeSlot?.endTime
        ? `${c.timeSlot.startTime} to ${c.timeSlot.endTime}`
        : null
    }));

    await redisClient.setEx(cacheTitle, 10 * 60, JSON.stringify(transformed)); 

    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      transformed
    );
  } catch (error) {
    console.error("Error fetching contests by categoryTitle:", error.message);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      error.message
    );
  }
};
