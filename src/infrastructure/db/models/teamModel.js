import mongoose from 'mongoose'
import { v4 as uuidv4 } from "uuid";

const {Schema} = mongoose;

const TeamSchema = new Schema({
    teamId:{ type: String, default: uuidv4 },
    userId:{type:String,required:true},
    contestId:{type:String,required:true},
    selectedStocks:[{type:String}],
    score:{type:Number,default:0}
})
TeamSchema.index({ userId: 1 ,contestId:1});
export default mongoose.model("Teams", TeamSchema);