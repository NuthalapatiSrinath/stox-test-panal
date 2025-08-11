import axios from "axios";
import stockModel from "../../infrastructure/db/Models/stockModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { fetchIntradayData } from '../../application/services/stocksService.js';
import dotenv from "dotenv";
dotenv.config();
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
    console.log(tickers)
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
// const symbols = [
//   "RELIANCE.XBOM", "TCS.XBOM", "INFY.XBOM", "HDFCBANK.XBOM", "ICICIBANK.XBOM",
//   "KOTAKBANK.XBOM", "SBIN.XBOM", "AXISBANK.XBOM", "LT.XBOM", "ITC.XBOM",
//   "HINDUNILVR.XBOM", "BHARTIARTL.XBOM", "ASIANPAINT.XBOM", "BAJFINANCE.XBOM",
//   "MARUTI.XBOM", "SUNPHARMA.XBOM", "ULTRACEMCO.XBOM", "POWERGRID.XBOM",
//   "NESTLEIND.XBOM", "WIPRO.XBOM", "ONGC.XBOM", "NTPC.XBOM", "TITAN.XBOM",
//   "TECHM.XBOM", "BAJAJFINSV.XBOM", "TATAMOTORS.XBOM", "INDUSINDBK.XBOM",
//   "GRASIM.XBOM", "HCLTECH.XBOM", "BAJAJ-AUTO.XBOM", "JSWSTEEL.XBOM",
//   "DRREDDY.XBOM", "HDFCLIFE.XBOM", "ADANIENT.XBOM", "CIPLA.XBOM",
//   "DIVISLAB.XBOM", "BRITANNIA.XBOM", "COALINDIA.XBOM", "HINDALCO.XBOM",
//   "SBILIFE.XBOM", "BPCL.XBOM", "IOC.XBOM", "EICHERMOT.XBOM", "HEROMOTOCO.XBOM",
//   "GAIL.XBOM", "VEDL.XBOM", "TATASTEEL.XBOM", "SHREECEM.XBOM", "ZOMATO.XBOM"
// ];
// export const fetchAndStore = async (req, res) => {
//   const storedSymbols = [];

//   for (const symbol of symbols) {
//     try {
//       console.log(`🔍 Fetching: ${symbol}`);
//       const response = await axios.get(`http://api.marketstack.com/v1/eod`, {
//         params: {
//           access_key: process.env.MARKETSTACK_API_KEY,
//           symbols: symbol,
//           limit: 1,
//         },
//       });

//       const [latest] = response.data.data;

//       if (!latest) {
//         console.warn(`⚠️ No data for ${symbol}`);
//         continue;
//       }

//       const formatted = {
//         symbol: latest.symbol,
//         date: latest.date,
//         open: latest.open,
//         high: latest.high,
//         low: latest.low,
//         close: latest.close,
//         volume: latest.volume,
//         lastUpdated: new Date(),
//       };

//       await stockModel.findOneAndUpdate(
//         { symbol },
//         { ...formatted },
//         { upsert: true }
//       );

//       console.log(`✅ Stored: ${symbol}`);
//       storedSymbols.push(symbol);

//       await new Promise((r) => setTimeout(r, 500)); // Respect free-tier limits
//     } catch (err) {
//       console.error(`❌ Error for ${symbol}:`, err.message);
//     }
//   }

//   return res.status(200).json({
//     success: true,
//     statusCode: 200,
//     message: "Indian stock data fetched and stored",
//     data: { storedSymbols },
//   });
// };


export const fetchAndStore = async (req, res) => {
  try {
    const symbols = [
      "RELIANCE.NS", "TCS.NS", "INFY.NS", "ICICIBANK.NS", "HDFCBANK.NS",
      "SBIN.NS", "AXISBANK.NS", "ITC.NS", "KOTAKBANK.NS", "HINDUNILVR.NS"
    ];

    const eodData = [];

    for (let i = 0; i < symbols.length; i += 5) {
      const batch = symbols.slice(i, i + 5).join(',');

      console.log(`🔍 Fetching batch: ${batch}`);

      const response = await axios.get("http://api.marketstack.com/v1/eod", {
        params: {
          access_key: "034b14791ffa523f9f704043e013d196",
          symbols: batch,
          limit: 1
        },
        timeout: 10000
      });

      const data = response.data.data;

      if (!data.length) {
        console.warn("⚠️ Empty response from MarketStack");
        continue;
      }

      eodData.push(...data);
    }

    // Save to DB
    const operations = eodData.map(entry => ({
      updateOne: {
        filter: { symbol: entry.symbol },
        update: {
          $push: {
            eodData: {
              date: entry.date,
              open: entry.open,
              high: entry.high,
              low: entry.low,
              close: entry.close,
              volume: entry.volume
            }
          }
        },
        upsert: true
      }
    }));

    await stockModel.bulkWrite(operations);

    return res.status(200).json({
      success: true,
      message: "EOD data stored successfully",
      count: eodData.length
    });

  } catch (err) {
    console.error("❌ EOD Fetch Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch EOD data" });
  }
};




// export const fetchAndStore = async (req, res) => {
//   console.log("⚡ fetchAndStore called");

// const symbols = ['AAPL', 'MSFT', 'GOOGL'];
//   const storedSymbols = [];

//   for (const symbol of symbols) {
//     console.log(`Fetching data for ${symbol}`);
//     const data = await fetchIntradayData(symbol);

//     if (!data || !Object.keys(data).length) {
//       console.warn(`⚠️ No data for ${symbol}`);
//       continue;
//     }

//     const formatted = Object.entries(data).map(([timestamp, values]) => ({
//       timestamp: new Date(timestamp),
//       open: parseFloat(values['1. open']),
//       high: parseFloat(values['2. high']),
//       low: parseFloat(values['3. low']),
//       close: parseFloat(values['4. close']),
//       volume: parseInt(values['5. volume']),
//     }));

//     await stockModel.findOneAndUpdate(
//       { symbol },
//       {
//         symbol,
//         data: formatted,
//         lastUpdated: new Date(),
//       },
//       { upsert: true }
//     );

//     console.log(`✅ Stored data for ${symbol}`);
//     storedSymbols.push(symbol);

//     await new Promise(resolve => setTimeout(resolve, 15000)); // to respect rate limit
//   }

//   return sendResponse(res, 200, "OK", { storedSymbols });
// };




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
    console.logh(err);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message,error);
  }
};

export const replaceStock = async(req,res)=>{
  try{
    const { newSymbol, replaceSymbol } = req.body;
    if (!newSymbol || !replaceSymbol) {
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const newStock = await stockModel.findOne({ symbol: newSymbol });
    const stockToUnselect = await stockModel.findOne({ symbol: replaceSymbol });
     if (!newStock || !stockToUnselect) {
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.meesage_4);
    }
        if (newStock.isSelected) {
      return sendResponse(res,HttpResponse.ALREADY_EXISTS.code,HttpResponse.ALREADY_EXISTS.message_3)
    }

    if (!stockToUnselect.isSelected) {
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message_2)
    }
      stockToUnselect.isSelected = false;
    newStock.isSelected = true;

    await stockToUnselect.save();
    await newStock.save();
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{'replaced':replaceSymbol,'selected': newSymbol,})
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message,{error})
  }
}