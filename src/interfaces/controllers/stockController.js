import axios from "axios";
import stockModel from "../../infrastructure/db/Models/stockModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
export const fetchAndStoreTickers = async (req, res) => {
  try {
    const response = await axios.get("http://api.marketstack.com/v1/exchanges/XBOM/tickers", {
      params: {
        access_key: "034b14791ffa523f9f704043e013d196",
        limit: 100
      },
      timeout: 10000
    });
    const tickers = response.data.data?.tickers;
    if (!Array.isArray(tickers)) {
      return res.status(500).json({ success: false, message: "Tickers not found" });
    }

    const operations = tickers.map(ticker => ({
      updateOne: {
        filter: { symbol: ticker.symbol },
        update: {
          name: ticker.name,
          symbol: ticker.symbol,
          has_intraday: ticker.has_intraday,
          has_eod: ticker.has_eod
        },
        upsert: true
      }
    }));
    const result = await stockModel.bulkWrite(operations);
    return res.status(200).json({
      success: true,
      message: "Tickers stored successfully",
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      tickers
    });

  } catch (err) {
    console.error("Marekt Stack API is Not Working:", err.message);
    return res.status(500).json({ success: false, message: "Failed to store tickers" });
  }
};
export const getTotalStocks = async(req,res)=>{
  try{
    const totalStockData = await stockModel.find();
    if(!totalStockData){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.meesage_4)
    }
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{totalStockData})
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message)
  }
}
export const updateSelectedStocks = async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length !== 20) {
    return sendResponse(res,HttpResponse.BAD_REQUEST.code,HttpResponse.BAD_REQUEST.message_4)
    }
    await stockModel.updateMany({}, { isSelected: false });
    await stockModel.updateMany(
      { symbol: { $in: symbols } },
      { $set: { isSelected: true } }
    );
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message_3)
  } catch (error) {
    console.error(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message,error)
  }
};
export const getSelectedStocks = async (req, res) => {
  try {
    const stocks = await stockModel.find({ isSelected: true });
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{stocks})
  } catch (err) {
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message,error);
  }
};