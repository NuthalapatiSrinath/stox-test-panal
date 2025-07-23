import mongoose, { Model } from "mongoose";
import {
  tpeOfTransaction,
  transactionResult,
} from "../../../domain/constants/enums.js";
const { Schema } = mongoose;
const walletSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String },
    balance: { type: Number, default: 0 },
    transactions: [
      {
        transactionType: {
          type: String,
          enum: Object.values(tpeOfTransaction),
        },
        amount: { type: Number, required: true },
        date: { type: Date },
        status: { type: String, enum: Object.values(transactionResult) },
        tnxId: { type: String },
      },
    ],
  },
  { timestamps: true }
);
const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
