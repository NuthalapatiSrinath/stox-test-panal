import express from 'express';
import { addContest,deleteContest,getContestByType,getContestDetails,getContestsByCategoryTitle } from '../controllers/contestController.js';

const router = express.Router();

router.post('/createContest',addContest);
router.post("/getContestsByTitle", getContestsByCategoryTitle);
router.post("/getContest",getContestDetails);
router.post("/getContestByType",getContestByType);
router.delete("/deleteContest",deleteContest);
export default router;