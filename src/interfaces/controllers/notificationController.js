import notificationModel from "../../infrastructure/db/Models/notificationModel.js";
import { sendResponse } from "../middlewares/responseHandler.js";
import { HttpResponse } from "../../utils/responses.js";
import { uploadNotificationImage } from "../../application/services/s3Upload.js";
import { sendPushNotification } from "../../utils/sendPushNotification.js";
import userModel from "../../infrastructure/db/Models/userModel.js";
import admin from 'firebase-admin';

export const uploadNotificationDocument =async  (req, res) => {
  const uploadSingle = uploadNotificationImage(process.env.S3_BUCKET_NAME).single("notificationImageUrl");

  uploadSingle(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    try {
      const { title, description } = req.body;

      if (!title || !description) {
        return sendResponse(
          res,
          HttpResponse.ALL_FIELDS_REQUIRED.code,
          HttpResponse.ALL_FIELDS_REQUIRED.message
        );
      }
      const notificationImageUrl = req.file?.location || null;
      const notification = await notificationModel.create({
        title,
        description,
        notificationImageUrl
      });

      return sendResponse(
        res,
        HttpResponse.OK.code,
        "Notification created successfully",
        notification
      );
    } catch (error) {
      console.error(error);
      return sendResponse(
        res,
        HttpResponse.INTERNAL_SERVER_ERROR.code,
        HttpResponse.INTERNAL_SERVER_ERROR.message,
        error
      );
    }
  });
};
export const deleteNotification = async(req,res)=>{
  try{
    const {notificationId}= req.body;
    if(!notificationId){
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const deleteNotificationDocument = await notificationModel.findOneAndDelete({notificationId});
    if(!deleteNotificationDocument){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_5)
    }
    return sendResponse(res,HttpResponse.DELETED.code,HttpResponse.DELETED.message)
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
}
export const sendNotificationById = async (req, res) => {
  try {
    const { notificationId, userId } = req.body;

    if (!notificationId || !userId) {
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const notification = await notificationModel.findOne({ notificationId });
    const user = await userModel.findOne({ userId });

    if (!notification) {
      return sendResponse()
    }

    if (!user || !user.fcmToken) {
      return res.status(404).json({ message: "User or FCM token not found" });
    }

    const { title, description, notificationImageUrl } = notification;

    const result = await sendPushNotification({
      title,
      body: description,
      imageUrl: notificationImageUrl,
      fcmToken: user.fcmToken,
    });

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully",
      responseId: result,
    });
  } catch (error) {
    console.error("Error sending FCM notification:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const sendExistingNotification = async (req, res) => {
  try {
    const { notificationId, userIds } = req.body;
    if (!notificationId || !userIds?.length) {
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const notification = await notificationModel.findOne({ notificationId });
    if (!notification) {
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_5)
    }
    const users = await userModel.find({ userId: { $in: userIds }, fcmToken: { $exists: true, $ne: null } });
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No valid users with FCM tokens found" });
    }
    const sendTasks = users.map((user) => {
      return admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.description,
          image: notification.notificationImageUrl || undefined
        },
        data: {
          userId: user.userId,
          type: "custom_notification"
        }
      });
    });
    await Promise.allSettled(sendTasks);
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message_5)
  } catch (err) {
    console.log(error);
    sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
};
export const sendNotificationToAll = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const notification = await notificationModel.findOne({ notificationId });
    if (!notification) {
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_5);
    }
    const users = await userModel.find({ fcmToken: { $exists: true, $ne: null } });
    if (!users.length) {
      return res.status(404).json({ success: false, message: "No users with FCM tokens found" });
    }
    const sendPromises = users.map((user) => {
      return admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.description,
          image: notification.notificationImageUrl || undefined
        },
        data: {
          userId: user.userId,
          type: "broadcast"
        }
      });
    });
    const results = await Promise.allSettled(sendPromises);
    const successes = results.filter(r => r.status === "fulfilled").length;
    const failures = results.filter(r => r.status === "rejected").length;
    return res.status(200).json({
      success: true,
      message: `Notification sent to ${successes} users, ${failures} failed.`,
    });
  } catch (err) {
    console.log(err);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message)
  }
};
export const editNotificationDocument = async(req,res)=>{
  try{
    const {notificationId,notificationData}= req.body;
    if(!notificationId||!notificationData){
      return sendResponse(res,HttpResponse.ALL_FIELDS_REQUIRED.code,HttpResponse.ALL_FIELDS_REQUIRED.message);
    }
    const editNotification = await notificationModel.findOneAndUpdate({notificationId},{$set:notificationData},{new:true});
    if(!editNotification){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_5);
    }
    return sendResponse(res,HttpResponse.UPDATED.code,HttpResponse.UPDATED.message,editNotification);
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message);
  }
}
export const enableDisableNotification = async (req, res) => {
  try {
    const { notificationId, disable } = req.body;
    if (!notificationId || disable === undefined) {
      return sendResponse(
        res,
        HttpResponse.ALL_FIELDS_REQUIRED.code,
        HttpResponse.ALL_FIELDS_REQUIRED.message
      );
    }
    const disableContest = await notificationModel.findOneAndUpdate(
      { notificationId },
      { $set: { disable } },
      { new: true }
    );
    if (!disableContest) {
      return sendResponse(
        res,
        HttpResponse.NOT_FOUND.code,
        HttpResponse.NOT_FOUND.message_2
      );
    }
    return sendResponse(
      res,
      HttpResponse.UPDATED.code,
      HttpResponse.UPDATED.message,
      { disableContest }
    );
  } catch (error) {
    console.log(error);
    return sendResponse(
      res,
      HttpResponse.INTERNAL_SERVER_ERROR.code,
      HttpResponse.INTERNAL_SERVER_ERROR.message,
      { error }
    );
  }
};
export const getNotifications = async(req,res)=>{
  try{
    const getAllNotifications = await notificationModel.find();
    if(!getAllNotifications){
      return sendResponse(res,HttpResponse.NOT_FOUND.code,HttpResponse.NOT_FOUND.message_5);
    }
    return sendResponse(res,HttpResponse.OK.code,HttpResponse.OK.message,{getAllNotifications})
  }catch(error){
    console.log(error);
    return sendResponse(res,HttpResponse.INTERNAL_SERVER_ERROR.code,HttpResponse.INTERNAL_SERVER_ERROR.message)
  }
}