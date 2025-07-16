import admin from 'firebase-admin';
import fs from 'fs';
const serviceAccount = JSON.parse(
  fs.readFileSync('src/utils/fireBaseServiceAccount.json')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_BASE_DATABASE_URL
});

const db = admin.database();
export default db;
