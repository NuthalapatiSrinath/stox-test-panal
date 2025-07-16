import express from "express";
import {joinContestWithTeam} from '../controllers/teamController.js'
import { verifyToken } from "../middlewares/verifyToken.js";
const router = express.Router();
router.post("/joinContestWithTeam",verifyToken, joinContestWithTeam);
export default router;