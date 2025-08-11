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
// export const sendOtpEmail = async (emailId, otp) => {
//   const mailOptions = {
//     from: `"Your App" <${process.env.MAIL_FROM_ADDRESS}>`,
//     to: emailId,
//     subject: 'Your OTP Code',
//     html: `
//       <h2>OTP Verification</h2>
//       <p>Your OTP code is: <b>${otp}</b></p>
//       <p>This code is valid for 10 minutes.</p>
//     `
//   };

//   await transporter.sendMail(mailOptions);
// };
export const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Stox11" <${process.env.MAIL_USERNAME}>`,
    to,
    subject: 'Your OTP for stox11 App Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 8px; background-color: #f9f9f9; color: #333; border: 1px solid #e0e0e0;">
        <h2 style="color: #27ae60;">Welcome to Stox11!</h2>
        <p style="font-size: 16px;">Dear User,</p>
        <p style="font-size: 16px;">Thank you for registering with <strong>Stox11</strong>. Please use the following OTP to complete your registration:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; background-color: #27ae60; color: #fff; font-size: 24px; padding: 12px 24px; border-radius: 8px; font-weight: bold; letter-spacing: 3px;">
            ${otp}
          </span>
        </div>

        <p style="font-size: 14px; color: #555;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="font-size: 14px; color: #999;">If you did not request this OTP, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        
        <p style="font-size: 14px;">Regards,</p>
        <p style="font-size: 14px; font-weight: bold;">Stox11 Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(` OTP email sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send OTP email to ${to}:`, err);
    throw new Error('OTP email sending failed');
  }
};
export const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: `"Stox11 Support" <${process.env.MAIL_USERNAME}>`,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error(`Error sending email to ${to}:`, err.message);
  }
};
// export const generateOtp = async () => {
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
//   const key = `otp:${userId}:${type}`;
//   await redisClient.setEx(key, 300, hashedOtp);
//   console.log(`🔐 OTP for ${userId}: ${otp}`); // In real world, integrate with SMS/Email
//   return otp;
// };
export const generateOtp = async (length = 4)=> {
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
