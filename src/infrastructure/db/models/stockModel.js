import mongoose from 'mongoose'

const {Schema} = mongoose;

const snapshotSchema = new mongoose.Schema({
  timestamp: Date,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
});
const stockSchema = new Schema({
   name:{type:String,required:true},
   symbol:{type:String,required:true},
   isSelected:{type:Boolean,default:false},
   has_intraday: { type: Boolean },
   has_eod: { type: Boolean },
   data:[snapshotSchema]
},
{ timestamps: true })
export default mongoose.model("Stocks", stockSchema);