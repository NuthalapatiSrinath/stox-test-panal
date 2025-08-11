import mongoose from "mongoose";
import { WITHDRAWREQUESTRESULT } from "../../../domain/constants/enums.js";
import { v4 as uuidv4 } from "uuid";

const withdrawRequestSchema = new mongoose.Schema({
  withDrawRequestId:{type: String, default: uuidv4},
  userId: {type:String},
  username: {type:String},
  name: {type:String},
  amount:{type: Number},
  status: {
    type: String,
    enum: Object.values(WITHDRAWREQUESTRESULT),
    default: WITHDRAWREQUESTRESULT.PENDING,
  },
},{timestamps:true});

export default mongoose.model("WithdrawRequest", withdrawRequestSchema);
