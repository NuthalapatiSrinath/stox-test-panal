import axios from "axios";
import stockModel from "../../infrastructure/db/Models/stockModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
export const fetchAndStoreTickers = async (req, res) => {
  try {
    const response = await axios.get("http://api.marketstack.com/v1/exchanges/XBOM/tickers", {
      params: {
        access_key: "91fb4c797ef69e6b8460207d08ab01ff",
        limit: 6743
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
    console.error("Fetch error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to store tickers" });
  }
};
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