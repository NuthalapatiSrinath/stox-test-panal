import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const notificationSchema = new mongoose.Schema({
    notificationId:{ type: String, default: uuidv4 , unique: true },
    title:{type:String,required:true},
    description:{type:String,required:true},
    notificationImageUrl:{type:String},
    disable:{type:Boolean,default:false}
},
{timestamps:true});

export default mongoose.model("Notifications", notificationSchema);
