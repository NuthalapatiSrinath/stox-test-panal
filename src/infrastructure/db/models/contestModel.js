import mongoose from "mongoose";
import {
  CONTESTFORMAT,
  CONTESTTYPE,
  HOURTYPE,
} from "../../../domain/constants/enums.js";
import { v4 as uuidv4 } from "uuid";

const winningSchema = new mongoose.Schema(
  {
    isRange: { type: Boolean, default: false },
    fromRank: { type: Number, required: true },
    toRank: { type: Number },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const contestSchema = new mongoose.Schema(
  {
    contestId: { type: String, default: uuidv4, unique: true },
    contestType: {
      type: String,
      enum: Object.values(CONTESTTYPE),
      required: true,
    },
    hourType: {
      type: String,
      enum: Object.values(HOURTYPE),
      default: null,
    },
    description: { type: String },
    entryFee: { type: Number, required: true },
    entryLimit: { type: Number, required: true },
    noOfSlots: { type: Number, required: true },
    contestFormat: {
      type: String,
      eum: Object.values(CONTESTFORMAT),
      required: true,
    },
    commissionPercentage: { type: Number, default: 0 },
    percentageOfWinners: { type: Number, required: true },
    dateFrom: { type: Date, required: true },
    dateTo: { type: Date },
    untilAdminEnds: { type: Boolean, default: false },
    timeFrom: { type: String, required: true },
    timeTo: { type: String },
    spotsLeft: { type: Number, required: true },
    winningAmounts: [winningSchema],
    disable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Contest", contestSchema);
