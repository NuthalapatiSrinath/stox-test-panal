import express from "express";
import { deleteNotification, sendExistingNotification, sendNotificationById, uploadNotificationDocument } from "../controllers/notificationController.js";
const router = express.Router();
router.post("/createNotification",uploadNotificationDocument );
router.delete("/deleteNotification",deleteNotification);
router.post('/send', sendNotificationById);
router.post('/sendNotificationsToMoreUsers',sendExistingNotification)
export default router;