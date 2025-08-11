import mongoose from "mongoose";
import { sendResponse } from "../middlewares/responseHandler.js";
import userModel from "../../infrastructure/db/models/userModel.js";
import contestModel from "../../infrastructure/db/Models/contestModel.js";
import teamModel from "../../infrastructure/db/Models/teamModel.js";
import Wallet from "../../infrastructure/db/Models/walletModel.js";
import ExcelJS from "exceljs";

export const getParticipationReport = async (req, res) => {
  try {
    const { startDate, endDate, contestType } = req.query;

    const pipeline = [
      { $unwind: "$joinedContests" },
      {
        $match: {
          "joinedContests.joinedAt": {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $lookup: {
          from: "teams",
          localField: "joinedContests.teamId",
          foreignField: "teamId",
          as: "team",
        },
      },
      { $unwind: "$team" },
      {
        $lookup: {
          from: "contests",
          localField: "joinedContests.contestId",
          foreignField: "contestId",
          as: "contest",
        },
      },
      { $unwind: "$contest" },
      ...(contestType
        ? [{ $match: { "contest.contestType": contestType } }]
        : []),

      {
        $project: {
          userName: "$name",
          email: "$emailId",
          mobile: "$mobileNumber",
          contestFormat: "$contest.contestFormat",
          contestType: "$contest.contestType",
          joinedAt: "$joinedContests.joinedAt",
          score: "$team.score",
        },
      },
    ];

    const result = await userModel.aggregate(pipeline);

    return sendResponse(res, 200, "Participation report generated", result);
  } catch (err) {
    console.error("Report Error:", err);
    return sendResponse(res, 500, "Failed to generate report", err);
  }
};
export const getContestPerformanceReport = async (req, res) => {
  try {
    const contests = await contestModel.aggregate([
      {
        $lookup: {
          from: "teams",
          localField: "contestId",
          foreignField: "contestId",
          as: "joinedTeams",
        },
      },
      {
        $project: {
          contestType: 1,
          contestId: 1,
          fromDate: "$dateFrom",
          toDate: "$dateTo",
          totalSlots: "$noOfSlots",
          spotsLeft: 1,
          joinedUsers: { $size: "$joinedTeams" },
          joinPercentage: {
            $cond: [
              { $gt: ["$noOfSlots", 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ["$noOfSlots", "$spotsLeft"] },
                      "$noOfSlots",
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    return sendResponse(res, 200, "Contest performance report", contests);
  } catch (err) {
    return sendResponse(res, 500, "Failed to generate contest performance", err.message);
  }
};
export const getRevenueSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // Build dynamic match condition
    const matchConditions = {
      "transactions.status": "success",
      "transactions.transactionType": { $in: ["top-up", "withdraw"] }
    };

    if (fromDate || toDate) {
      matchConditions["transactions.date"] = {};
      if (fromDate) matchConditions["transactions.date"].$gte = new Date(fromDate);
      if (toDate) matchConditions["transactions.date"].$lte = new Date(toDate);
    }

    const aggregation = await Wallet.aggregate([
      { $unwind: "$transactions" },
      { $match: matchConditions },
      {
        $group: {
          _id: "$transactions.transactionType",
          totalAmount: { $sum: "$transactions.amount" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          transactionType: "$_id",
          totalAmount: 1,
          count: 1
        }
      }
    ]);

    const result = {
      totalTopUps: 0,
      topUpCount: 0,
      totalWithdrawals: 0,
      withdrawalCount: 0
    };

    aggregation.forEach(item => {
      if (item.transactionType === "top-up") {
        result.totalTopUps = `₹${item.totalAmount}`;
        result.topUpCount = item.count;
      } else if (item.transactionType === "withdraw") {
        result.totalWithdrawals = `₹${item.totalAmount}`;
        result.withdrawalCount = item.count;
      }
    });

    return sendResponse(res, 200, "Transaction summary report generated", result);
  } catch (err) {
    console.error(err);
    return sendResponse(res, 500, "Failed to generate transaction summary report", err.message);
  }
};
export const getTransactionSummaryReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const from = fromDate ? new Date(fromDate) : new Date("1970-01-01");
    const to = toDate
      ? new Date(new Date(toDate).setHours(23, 59, 59, 999))
      : new Date();

    // Fetch all users
    const users = await userModel.find();

    const report = users.map((user) => {
      const contestsInDateRange = user.joinedContests.filter((contest) => {
        const joinedAt = new Date(contest.joinedAt);
        return joinedAt >= from && joinedAt <= to;
      });

      const lastContestDate =
        contestsInDateRange.length > 0
          ? new Date(
              Math.max(...contestsInDateRange.map((c) => new Date(c.joinedAt)))
            )
          : null;

      return {
        name: user.name,
        username: user.username,
        mobileNumber: user.mobileNumber,
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        totalTopups: user.totalTopups,
        totalJoinedContests: contestsInDateRange.length,
        lastContestJoinedDate: lastContestDate
          ? lastContestDate.toISOString().split("T")[0]
          : "",
      };
    });

    const filtered = report.filter((r) => r.totalJoinedContests > 0);


    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transaction Summary");
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Username", key: "username", width: 20 },
      { header: "Mobile Number", key: "mobileNumber", width: 15 },
      { header: "Wallet Balance", key: "walletBalance", width: 15 },
      { header: "Total Earnings", key: "totalEarnings", width: 15 },
      { header: "Total Topups", key: "totalTopups", width: 15 },
      { header: "Total Joined Contests", key: "totalJoinedContests", width: 20 },
      { header: "Last Contest Joined Date", key: "lastContestJoinedDate", width: 20 },
    ];

    // 📌 Add Data Rows
    filtered.forEach((row) => {
      worksheet.addRow(row);
    });

    // 📌 Make header bold
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // 📤 Send file to client
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=transaction_summary_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      "Error generating report",
      err.message
    );
  }
};