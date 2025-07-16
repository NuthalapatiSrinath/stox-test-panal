import mongoose from 'mongoose'

const {Schema} = mongoose;

const stockSchema = new Schema({
   name:{type:String,required:true},
   symbol:{type:String,required:true},
   isSelected:{type:Boolean,default:false},
   has_intraday: { type: Boolean },
   has_eod: { type: Boolean }
},
{ timestamps: true })
export default mongoose.model("Stocks", stockSchema);