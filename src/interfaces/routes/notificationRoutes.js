import express from "express";
import { deleteNotification, editNotificationDocument, enableDisableNotification, getNotifications, sendExistingNotification, sendNotificationById, sendNotificationToAll, uploadNotificationDocument } from "../controllers/notificationController.js";
const router = express.Router();
router.post("/createNotification",uploadNotificationDocument );
router.delete("/deleteNotification",deleteNotification);
router.post('/send', sendNotificationById);
router.post('/sendNotificationsToMoreUsers',sendExistingNotification);
router.post('/sendNotificationToAllUsers',sendNotificationToAll);
router.put("/updateNotificationDocument",editNotificationDocument);
router.patch("/enableDisableNotification",enableDisableNotification);
router.get("/getAllNotifications",getNotifications)
export default router;