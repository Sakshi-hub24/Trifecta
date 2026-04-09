import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  updates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Update' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);