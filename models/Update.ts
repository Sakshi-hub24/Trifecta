import mongoose from 'mongoose';

const UpdateSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  whatDid: { type: String, required: true },
  whatWillDo: { type: String },
  blockers: { type: String },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['like', 'thumbs_up', 'heart'], default: 'like' },
  }],
}, { timestamps: true });

export default mongoose.models.Update || mongoose.model('Update', UpdateSchema);