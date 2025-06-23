import express from 'express';
import { registerUser, verifyOtp, submitKyc } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/submit-kyc', submitKyc);

export default router;
