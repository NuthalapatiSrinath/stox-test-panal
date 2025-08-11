import contest from "../../infrastructure/db/Models/contestModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { normalizeTime } from "../middlewares/normalization.js";
import redisClient from "../../infrastructure/redis/index.js";
import contestModel from "../../infrastructure/db/Models/contestModel.js";
import dayjs from 'dayjs';
export const addContest = async (req, res) => {
  try {
    const contestData = req.body;
    if (!contestData || !contestData.noOfSlots) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }
      if (contestData.dateTo) {
      contestData.dateTo = dayjs(contestData.dateTo, 'DD-MM-YYYY').toDate();
    }
    contestData.contestFormat = contestData.noOfSlots===2?"Head to Head Contest":"Multiple Member Contest";
    console.log(contestData);
    const createdContest = await contest.create(contestData);
    const contestType = createdContest.contestType;
    const startTime = createdContest.timeFrom?.timeTo;
    await redisClient.del(`contest:${contestType}`);
    if (startTime) {
      await redisClient.del(`contest:${contestType}:${startTime}`);
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
export const getContestByType= async (req, res) => {
  try {
    const { contestType, time } = req.body;
    if (!contestType) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }
    const cacheTitle = time
      ? `contest:${contestType}:${time}`
      : `contest:${contestType}`;
    const cachedContest = await redisClient.get(cacheTitle);
    if (cachedContest) {
      console.log("Contest served from Redis cache");
      return sendResponse(
        res,
        HttpResponse.OK.code,
        HttpResponse.OK.message,
        JSON.parse(cachedContest)
      );
    }
    const query = {
      contestType: new RegExp(`^${contestType}$`, "i"),
    };
    if (time && contestType.toLowerCase() === "intra day") {
      query["timeFrom"] = normalizeTime(time);
    }

    const contests = await contest.find(query).sort({ createdAt: -1 });

    const transformed = contests.map((c) => ({
      contestId:c.contestId,
      contestType:c.contestType,
      pricePool: c.pricePool,
      hourType:c.hourType,
      entryFee: c.entryFee,
      spotsLeft: c.spotsLeft,
      totalSpots: c.noOfSlots,
      winAmount: c.winningAmounts,
      winningPercentage: c.percentageOfWinners,
      timings:
        c.timeFrom && c.timeTo
          ? `${c.timeFrom} to ${c.timeTo}`
          : null,
    }));
    await redisClient.setEx(cacheTitle, 10 * 60, JSON.stringify(transformed));

    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      {transformed}
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
export const getContestDetails = async (req, res) => {
  try {
    const { contestId } = req.body;
    if (!contestId) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }
    const contestCache = `contestId:${contestId}`;
    const contestDetails = await redisClient.get(contestCache);
    if (contestDetails) {
      console.log("Contest served from Redis cache");
      return sendResponse(
        res,
        HttpResponse.OK.code,
        HttpResponse.OK.message,
        JSON.parse(contestDetails)
      );
    }
    const contests = await contest.findOne({ contestId });
    if (!contests) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message_2
      );
    }
    await redisClient.setEx(contestCache, 60 * 10, JSON.stringify(contests));
    return sendResponse(
      res,
      HttpResponse.OK.code,
      HttpResponse.OK.message,
      contests
    );
  } catch (error) {
    console.log(error);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
// export const getContestByType = async (req, res) => {
//   try {
//     const { categoryTitle, contestType } = req.body;
//     if (!categoryTitle || !contestType) {
//       return sendResponse(
//         res,
//         HttpResponse.ALL_FIELDS_REQUIRED.code,
//         HttpResponse.ALL_FIELDS_REQUIRED.message
//       );
//     }
//     const findContest = await contest.find({ categoryTitle, contestType });
//     if (!findContest) {
//       return sendResponse(
//         res,
//         HttpResponse.NOT_FOUND.code,
//         HttpResponse.NOT_FOUND.message
//       );
//     }
//     return sendResponse(
//       res,
//       HttpResponse.OK.code,
//       HttpResponse.OK.message,
//       findContest
//     );
//   } catch (error) {
//     console.log(error);
//     return sendResponse(
//       res,
//       HttpResponse.INTERNAL_SERVER_ERROR.code,
//       HttpResponse.INTERNAL_SERVER_ERROR.message,
//       { error }
//     );
//   }
// };
export const updateContest = async (req, res) => {
  try {
    const { contestId, contestData } = req.body;
    if(!contestId || !contestData){
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const updatedData = await contest.findOneAndUpdate({contestId},{$set:contestData},{new:true});
    if(!updatedData){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_2);
    }
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,updatedData)
  } catch (error) {
    console.log(error);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message
    );
  }
};
export const deleteContest = async (req, res) => {
  try {
    const { contestId } = req.body;
    const deleteContest = await contest.findOneAndDelete({ contestId });
    if (!deleteContest) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message_2
      );
    }
    return sendResponse(res, HttpResponse.OK.code, "Deleted Successfully");
  } catch (error) {
    console.log(error);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      error
    );
  }
};
export const enableDisableContest = async (req, res) => {
  try {
    const { contestId, disable } = req.body;
    if (!contestId || disable === undefined) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }
    const disableContest = await contest.findOneAndUpdate(
      { contestId },
      { $set: { disable } },
      { new: true }
    );
    if (!disableContest) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message_2
      );
    }
    return sendResponse(
      res,
      HttpResponse.UPDATED.code,
      HttpResponse.UPDATED.message,
      { disableContest }
    );
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
export const getContests = async(req,res)=>{
  try{
    const allContests = await contestModel.find();
    if(!allContests){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_2);
    }
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{allContests})
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
}
export const getContestByContestFormat = async(req,res)=>{
  try{
    const {contestFormat}= req.body;
    if(!contestFormat){
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const contest = await contestModel.find({contestFormat});
    if(!contest){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_2);
    }
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{contest})
  }catch(error){
    console.log(error);
    sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
}