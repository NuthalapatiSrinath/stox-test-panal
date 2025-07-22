import { LEADERBOARDSTATUS } from "../../../domain/constants/enums";
import mongoose from mongoose;
import { v4 as uuidv4 } from "uuid";


const leaderBoardSchema = new mongoose.schema({
    leaderBoardId:{type:String,default:uuidv4},
    userId:{type:String,required:true},
    contestId:{type:String,required:true},
    teamId:{type:String,required:true},
    score:{type:Number,default:0},
    rank:{type:Number,default:null},
    prizeMoney:{type:Number,default:0},
},
{
    timestamps:true
});

leaderBoardSchema.index({contestId,teamId,userId});

export default mongoose.models.Leaderboard || mongoose.model("Leaderboard", leaderBoardSchema);