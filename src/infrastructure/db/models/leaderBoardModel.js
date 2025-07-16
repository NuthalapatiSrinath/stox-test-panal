import { LEADERBOARDSTATUS } from "../../../domain/constants/enums";
import mongoose from mongoose;
import { v4 as uuidv4 } from "uuid";

const {schema} = mongoose;

const leaderBoardSchema = new schema({
    leaderBoardId:{type:String,default:uuidv4},
    userId:{type:String,required:true},
    contestId:{type:String,required:true},
    teamId:{type:String,required:true},

    score:{type:Number,default:0},
    rank:{type:Number,default:null},
    prizeMoney:{type:Number,default:0},

    status:{type:String,enum:Object.values(LEADERBOARDSTATUS),default:'pending'},

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

leaderBoardSchema.index({contestId,teamId});

export default mongoose.models.Leaderboard || mongoose.model("Leaderboard", leaderBoardSchema);