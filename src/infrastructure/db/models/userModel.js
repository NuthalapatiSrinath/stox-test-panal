import mongoose from "mongoose";
const { Schema } = mongoose;
import { v4 as uuidv4 } from "uuid";
import { DocumentTypeEnum, KYC_STATUS } from "../../../domain/constants/enums.js";
import { type } from "os";
const UserSchema = new Schema(
  {
    userId: { type: String, default: uuidv4 },
    emailId: { type: String, required: true },
    username: { type: String },
    password: { type: String, required: true },
    mobileNumber: { type: String },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: Object.values(KYC_STATUS),
      default: "pending",
    },
    walletBalance: { type: Number, default: 0 },

    // OTP Verification
    otpCode: { type: String },
    otpType: { type: String, enum: ["email_verification", "login", "reset"] },
    otpExpiresAt: { type: Date },
    otpAttemptCount: { type: Number, default: 0 },
    otpLastSentAt: { type: Date },

    // KYC Fields
    fullName: { type: String },
    dateOfBirth: { type:String },
    gender: { type: String },
    documentType: { type: String, enum:Object.values(DocumentTypeEnum)},
    documentNumber: { type: String },
    documentImageUrl: { type: String },
    kycVerifiedAt: { type: Date },
    kycRejectionReason:{type:String},

    // Device & Login Info
    lastLoginAt: { type: Date },
    lastLoginIP: { type: String },
    loginMethod: { type: String, enum: ["email", "phone", "google", "apple"] },
    loginAttempts: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String },

    // Notification & Preferences
    notificationPrefs: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    darkMode: { type: Boolean, default: false },

    // Wallet Extensions
    walletLocked: { type: Boolean, default: false },
    walletCurrency: { type: String, default: "INR" },
    totalEarnings: { type: Number, default: 0 },
    totalTopups: { type: Number, default: 0 },
    
    //Joined Contests
    joinedContests: [
  {
    contestId: { type: String, required: true },
    teamId: { type: String},
    joinedAt: { type: Date, default: Date.now }
  }
],
joinedContestIds: [String],
  },
  { timestamps: true }
);

UserSchema.index({ emailId: 1 }, { unique: true });
UserSchema.index({ mobileNumber: 1 }, { unique: true, sparse: true });
UserSchema.index({ userId: 1 });
UserSchema.index({ role: 1, isActive: 1 }); 

export default mongoose.models.User || mongoose.model("User", UserSchema);
