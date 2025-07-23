import mongoose from "mongoose";
import { sendResponse } from "../middlewares/responseHandler.js";
import userModel from "../../infrastructure/db/models/userModel.js";
import contestModel from "../../infrastructure/db/Models/contestModel.js";
import teamModel from "../../infrastructure/db/Models/teamModel.js";
import Wallet from "../../infrastructure/db/Models/walletModel.js";
export const getParticipationReport = async (req, res) => {
  try {
    const { startDate, endDate, contestType } = req.query;

    const pipeline = [
      { $unwind: "$joinedContests" },
      {
        $match: {
          "joinedContests.joinedAt": {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $lookup: {
          from: "teams",
          localField: "joinedContests.teamId",
          foreignField: "teamId",
          as: "team"
        }
      },
      { $unwind: "$team" },
      {
        $lookup: {
          from: "contests",
          localField: "joinedContests.contestId",
          foreignField: "contestId",
          as: "contest"
        }
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
          score: "$team.score"
        }
      }
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
          as: "joinedTeams"
        }
      },
      {
        $project: {
          contestType: 1,
          contestId: 1,
          date: "$dateFrom",
          totalSlots: "$noOfSlots",
          spotsLeft: 1,
          joinedUsers: { $size: "$joinedTeams" },
          joinPercentage: {
            $multiply: [
              {
                $divide: [
                  { $subtract: ["$noOfSlots", "$spotsLeft"] },
                  "$noOfSlots"
                ]
              },
              100
            ]
          }
        }
      }
    ]);

    return sendResponse(res, 200, "Contest performance report", contests);
  } catch (err) {
    return sendResponse(res, 500, "Failed to generate contest performance", err.message);
  }
};

export const getTransactionReport = async (req, res) => {
  try {
    const aggregation = await Wallet.aggregate([
      { $unwind: "$transactions" },
      {
        $match: {
          "transactions.status": "success",
          "transactions.transactionType": { $in: ["Topup_Wallet", "wallet_withdraw"] }
        }
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            type: "$transactions.transactionType"
          },
          totalAmount: { $sum: "$transactions.amount" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.userId",
          totals: {
            $push: {
              type: "$_id.type",
              totalAmount: "$totalAmount",
              count: "$count"
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "userId",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: "$user.username",
          emailId: "$user.emailId",
          totalTopUps: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$totals",
                    as: "t",
                    cond: { $eq: ["$$t.type", "top-up"] }
                  }
                },
                as: "tt",
                in: "$$tt.totalAmount"
              }
            }
          },
          topUpCount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$totals",
                    as: "t",
                    cond: { $eq: ["$$t.type", "top-up"] }
                  }
                },
                as: "tt",
                in: "$$tt.count"
              }
            }
          },
          totalWithdrawals: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$totals",
                    as: "t",
                    cond: { $eq: ["$$t.type", "withdrawal"] }
                  }
                },
                as: "tt",
                in: "$$tt.totalAmount"
              }
            }
          },
          withdrawalCount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$totals",
                    as: "t",
                    cond: { $eq: ["$$t.type", "withdrawal"] }
                  }
                },
                as: "tt",
                in: "$$tt.count"
              }
            }
          }
        }
      }
    ]);
    return sendResponse(res, 200, "Transaction report generated", aggregation);
  } catch (err) {
    return sendResponse(res, 500, "Failed to generate transaction report", err.message);
  }
};
