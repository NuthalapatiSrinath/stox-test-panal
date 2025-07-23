import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";                 
import { Server } from "socket.io";         
import ngrok from "@ngrok/ngrok";
import connectDB from "./infrastructure/db/connection.js";
import indexRouter from './interfaces/routes/index.js';
import { setUserOnline, setUserOffline } from "./interfaces/controllers/userController.js"; 
import db from "./application/services/fireBase.js";
import cron from "node-cron";
import { runMissedJoinJob } from "./infrastructure/queues/jobs/notifyMissedJoinsJob.js";

dotenv.config();

const app = express();
const server = http.createServer(app);    
const io = new Server(server, {
  cors: { origin: "*" },                    
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection
await connectDB();

// Routes
app.use('/api', indexRouter);
cron.schedule("0 * * * *", () => {
  runMissedJoinJob();
});
// WebSocket Connection
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("user-online", async (userId) => {
    console.log("User online:", userId);
    socket.data.userId = userId;
    await setUserOnline(userId);
  });
  
  socket.on("disconnect", async () => {
    const userId = socket.data.userId;
    console.log("User disconnected:", userId);
    await setUserOffline(userId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () =>
  console.log(`Node.js web server at ${PORT} is running...`)
);

// Ngrok
// ngrok
//   .connect({ addr: PORT, authtoken_from_env: true })
//   .then(async (listener) => {
//     const url = listener.url();
//     console.log(`Ngrok running at: ${url}`);
//     await db.ref("apiUrl").set(url);
//     console.log("Ngrok URL pushed to Firebase");
//   })
//   .catch((err) => {
//     console.error("Error starting Ngrok:", err);
//   });