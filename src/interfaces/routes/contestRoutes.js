import express from 'express';
import { addContest,deleteContest,enableDisableContest,getContestByType,getContestDetails, updateContest } from '../controllers/contestController.js';

const router = express.Router();

router.post('/createContest',addContest);
router.post("/getContestsByTitle", getContestByType);
router.post("/getContest",getContestDetails);
router.post("/getContestByType",getContestByType);
router.delete("/deleteContest",deleteContest);
router.patch("/disableContest",enableDisableContest);
router.put("/editContestDetails",updateContest)
export default router;