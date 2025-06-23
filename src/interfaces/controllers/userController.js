import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import users from '../../infrastructure/db/models/userModel.js';
import { sendOtp, verifyStoredOtp } from '../services/otpService.js';

import { sendSuccess, sendError } from '../middlewares/responseHandler.js';
import { Op } from 'sequelize';

// @desc Register user and send OTP
export const registerUser = async (req, res) => {
  try {
    const { username, emailId, mobileNumber, password } = req.body;

    if (!username || !emailId || !mobileNumber || !password) {
      return sendError(res, { message: 'All fields are required' }, 400);
    }

    const existingUser = await users.findOne({
      where: {
        [Op.or]: [
          { emailId },
          { username },
          { mobileNumber }
        ]
      }
    });

    if (existingUser) {
      return sendError(res, { message: 'User already exists' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await users.create({
      userId: uuidv4(),
      emailId,
      username,
      password: passwordHash,
      mobileNumber,
      createdAt: new Date()
    });

    await sendOtp(newUser.userId, newUser.mobileNumber, 'email_verification');
    return sendSuccess(res, newUser, 'User registered successfully');
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = await verifyStoredOtp(user.userId, otp, 'email_verification');
    if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc Submit KYC details
export const submitKyc = async (req, res) => {
  try {
    const { userId, fullName, dateOfBirth, documentType, documentNumber, documentImageUrl } = req.body;

    const user = await users.findByPk(userId);
    if (!user) return sendError(res, { message: 'User not found' }, 404);

    user.fullName = fullName;
    user.dateOfBirth = dateOfBirth;
    user.documentType = documentType;
    user.documentNumber = documentNumber;
    user.documentImageUrl = documentImageUrl;
    user.kycStatus = 'pending';
    await user.save();

    return sendSuccess(res, user, 'KYC submitted successfully');
  } catch (error) {
    return sendError(res, error);
  }
};
