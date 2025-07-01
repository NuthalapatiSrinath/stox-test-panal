import express from 'express';
import userRoutes from './userRoutes.js';
import kycRoutes from './kycRoutes.js'
const router = express.Router();

router.use('/users', userRoutes);
router.use('/kyc',kycRoutes)
export default router;
