import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const logSchema = new mongoose.Schema({
  activity: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const adminSchema = new mongoose.Schema({
  adminId:{type: String, default: uuidv4,unique: true},
  mailId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  logs: [logSchema]
});

export default mongoose.model("Admin", adminSchema);
