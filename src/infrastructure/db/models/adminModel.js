import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
const AdminSchema = new mongoose.Schema({
  adminId: { type: String, default: uuidv4 },
  email: { type: String, required: true },
  password: { type: String, required: true },
  lastLogin: { type: Date }
});

export default mongoose.model("Admin",AdminSchema);