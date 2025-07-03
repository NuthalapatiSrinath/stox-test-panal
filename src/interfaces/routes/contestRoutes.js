import express from 'express';
import { addContest,getContestsByCategoryTitle } from '../controllers/contestController.js';

const router = express.Router();

router.post('/createContest',addContest);
router.post("/getContests", getContestsByCategoryTitle);
export default router;