import express from "express";
import { notifyFullyEngagedUsers, notifyLeastEngagedUsers, notifyMissedJoinUsers } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/top-active-users", notifyFullyEngagedUsers);
router.get("/get-leastEngaged_users",notifyLeastEngagedUsers);
router.get("/notifyMissedJoinUsers",notifyMissedJoinUsers);
export default router;
