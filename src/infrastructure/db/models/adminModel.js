import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { ADMINROLES } from "../../../domain/constants/enums.js";

const logSchema = new mongoose.Schema({
  activity: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const adminSchema = new mongoose.Schema({
  adminId:{type: String, default: uuidv4,unique: true},
  name:{type:String},
  mailId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role:{
    type:String,
    required:true,
    enum:Object.values(ADMINROLES)
  },
  profilePicture: {
    type: String,
    default: ''
  },
  logs: [logSchema]
});

export default mongoose.model("Admin", adminSchema);
