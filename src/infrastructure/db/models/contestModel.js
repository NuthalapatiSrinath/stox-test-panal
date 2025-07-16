import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {CONTESTCATEGORYTYPE,CONTESTYPE} from '../../../domain/constants/enums.js'
const contestSchema = new mongoose.Schema(
  {
    contestId: { type: String, default: uuidv4 },
    categoryTitle: {
      type: String,
      required: true,
      index: true,
    },
    categoryType: {
      type: String,
      enum: Object.values(CONTESTCATEGORYTYPE),
      required: true,
      index: true,
    },
    durationOption: {
      type: String,
    },
    description: { type: String },
    joinBefore: { type: String },
    resultTime: { type: String },
    contestType: {
      type: String,
      enum: Object.values(CONTESTYPE),
      required: true,
      index: true,
    },
    pricePool: {
      type: Number,
      required: true,
      index: true,
    },
    entryFee: {
      type: Number,
      required: true,
    },
    spots: {
      type: Number,
      required: true,
    },
    spotsLeft: {
      type: Number,
      required: true,
    },
    winAmount: {
      type: Number,
    },
    winningPercentage: {
      type: Number,
    },
    timeSlot: {
      startTime: { type: String },
      endTime: { type: String },
    },
    winningDistribution: [
  {
    isRange: { type: Boolean, required: true },
    fromRank: { type: Number },
    toRank: { type: Number },
    rank: { type: Number },
    amount: { type: Number, required: true }
  }
],

    countdownSeconds: {
      type: Number,
    },
  },
  { timestamps: true }
);

contestSchema.index({ categoryType: 1, contestType: 1 });
contestSchema.index({ pricePool: 1, winningPercentage: -1 });

export default mongoose.models.Contest || mongoose.model("Contest", contestSchema);