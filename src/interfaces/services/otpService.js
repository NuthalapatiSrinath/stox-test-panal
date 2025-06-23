// src/services/otpService.js
import crypto from 'crypto';
import redisClient from '../../infrastructure/redis/index.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_ENCRYPTION === 'ssl',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Your App" <${process.env.MAIL_USERNAME}>`,
    to: to,
    subject: 'Your OTP Code',
    html: `
      <h2>OTP Verification</h2>
      <p>Your OTP code is: <b>${otp}</b></p>
      <p>This code is valid for 10 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
// export const generateOtp = async () => {
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
//   const key = `otp:${userId}:${type}`;
//   await redisClient.setEx(key, 300, hashedOtp);
//   console.log(`🔐 OTP for ${userId}: ${otp}`); // In real world, integrate with SMS/Email
//   return otp;
// };
export const generateOtp = async (length = 6)=> {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  //  await redisClient.setEx(key, 300, hashedOtp);
  // console.log(`🔐 OTP for ${userId}: ${otp}`); 
  return otp;
}




export const verifyStoredOtp = async (userId, otp, type = 'email_verification') => {
  const key = `otp:${userId}:${type}`;
  const hashedStored = await redisClient.get(key);
  const hashedInput = crypto.createHash('sha256').update(otp).digest('hex');
  return hashedStored === hashedInput;
};
