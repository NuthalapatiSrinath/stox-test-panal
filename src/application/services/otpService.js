const redis = require('redis');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');

const client = redis.createClient();
const setAsync = promisify(client.set).bind(client);
const getAsync = promisify(client.get).bind(client);
const delAsync = promisify(client.del).bind(client);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendOtp = async (userId, phone, type) => {
  const otp = generateOtp();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await User.findByIdAndUpdate(userId, {
    otpCode: hashedOtp,
    otpType: type,
    otpExpiresAt: expiresAt,
    otpLastSentAt: new Date(),
    otpAttemptCount: 0,
  });

  await setAsync(`otp:${userId}`, otp, 'EX', 300); // store in Redis too
  console.log(`OTP sent to ${phone}: ${otp}`); // Replace with SMS service
};

exports.verifyStoredOtp = async (user, otp) => {
  const storedOtp = await getAsync(`otp:${user._id}`);
  if (!storedOtp) return false;
  return storedOtp === otp;
};