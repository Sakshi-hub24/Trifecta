import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for OAuth users
  role: { type: String, enum: ['manager', 'analyst', 'designer', 'member'], default: 'analyst' },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);