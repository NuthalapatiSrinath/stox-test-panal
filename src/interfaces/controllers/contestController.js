import {contest} from "../../infrastructure/db/Models/contestModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
export const addContest = async(req,res)=>{
    try{
        const contestData = req.body;
        if(!contestData){
            return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
        }
        const createContest = await contest.create(contestData);
        console.log("Created contest:", createContest); 
        return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,createContest);
    }catch(error){
        console.log(error.message);
        return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,error.message);
    }
}
export const getContestsByCategoryTitle = async (req, res) => {
  try {
    const { categoryTitle } = req.body;
    if (!categoryTitle) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        "categoryTitle is required in request body",
        null,
        false
      );
    }
    const contests = await contest.find({ categoryTitle }).sort({ createdAt: -1 });
    const transformed = contests.map(c => ({
      pricePool: c.pricePool,
      entryFee: c.entryFee,
      spotsLeft: c.spotsLeft,
      totalSpots: c.spots,
      winAmount: c.winAmount,
      contestType: c.contestType,
      winningPercentage: c.winningPercentage,
      startTime: c.timeSlot ? `${c.timeSlot.startTime} to ${c.timeSlot.endTime}` : null
    }));

    return sendResponse(
      res,
      HttpResponse.OK.code,
      "Contests fetched for category",
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
