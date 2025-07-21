// utils/sendPushNotification.js
import admin from 'firebase-admin';

/**
 * Sends a push notification to a single device token
 * @param {Object} payload - Contains title, body, image URL, and the FCM token
 */
export const sendPushNotification = async ({ title, body, imageUrl, fcmToken }) => {
  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    android: {
      notification: {
        imageUrl,
        sound: 'default',
      },
    },
    webpush: {
      notification: {
        image: imageUrl,
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title,
            body,
          },
          sound: 'default',
        },
      },
      fcmOptions: {
        image: imageUrl,
      },
    },
  };

  return await admin.messaging().send(message);
};
