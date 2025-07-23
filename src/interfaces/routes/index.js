import express from 'express';
import userRoutes from './userRoutes.js';
import kycRoutes from './kycRoutes.js';
import contestRoutes from './contestRoutes.js'
import teamRoutes from './teamRoutes.js'
import stockRoute from './stockRoutes.js'
import walletRoute from './walletRoutes.js'
import chatBotRoute from './chatBot.js'
import analyticsRoute from './analyticsRoutes.js'
import notificationRoute from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import participationReportRoute from './reportsRoutes.js'
const router = express.Router();

router.use('/users', userRoutes);
router.use('/kyc',kycRoutes);
router.use('/contest',contestRoutes);
router.use('/team',teamRoutes);
router.use('/stock',stockRoute);
router.use('/wallet',walletRoute);
router.use('/chatBot',chatBotRoute);
router.use('/analytics',analyticsRoute);
router.use('/notification',notificationRoute);
router.use('/admin',adminRoutes);
router.use('/reports',participationReportRoute)
export default router;
