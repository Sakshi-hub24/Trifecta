import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  update: { type: mongoose.Schema.Types.ObjectId, ref: 'Update', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);