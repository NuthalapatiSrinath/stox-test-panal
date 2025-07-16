import mongoose from 'mongoose';

const userEventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  metadata: { type: Object },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('UserEvent', userEventSchema);
