import express from 'express';
import userRoutes from './userRoutes.js';
import kycRoutes from './kycRoutes.js';
import contestRoutes from './contestRoutes.js'
const router = express.Router();

router.use('/users', userRoutes);
router.use('/kyc',kycRoutes);
router.use('/contest',contestRoutes)
export default router;
