// src/services/otpService.js
import crypto from 'crypto';
import redisClient from '../../infrastructure/redis/index.js';

export const sendOtp = async (userId, phone, type = 'email_verification') => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const key = `otp:${userId}:${type}`;
  await redisClient.setEx(key, 300, hashedOtp);
  console.log(`🔐 OTP for ${userId}: ${otp}`); // In real world, integrate with SMS/Email
  return otp;
};

export const verifyStoredOtp = async (userId, otp, type = 'email_verification') => {
  const key = `otp:${userId}:${type}`;
  const hashedStored = await redisClient.get(key);
  const hashedInput = crypto.createHash('sha256').update(otp).digest('hex');
  return hashedStored === hashedInput;
};
