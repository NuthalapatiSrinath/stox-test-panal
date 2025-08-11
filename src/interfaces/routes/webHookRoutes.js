import express from "express";
import { handleCashfreeWebhook } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/cashfree", express.json(), handleCashfreeWebhook);

export default router;
