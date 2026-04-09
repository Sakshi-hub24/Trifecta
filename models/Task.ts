import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  deadline: { type: Date },
  createdFrom: { type: String, enum: ['manual', 'ai'], default: 'manual' },
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);