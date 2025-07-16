import express from "express";
import { chatWithBot } from "../controllers/chatBotController.js";

const router = express.Router();
router.post("/chat",chatWithBot);
export default router;