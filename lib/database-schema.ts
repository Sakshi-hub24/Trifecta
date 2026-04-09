import mongoose from 'mongoose';

// MongoDB Collections (Models) for Async Copilot
// Note: In MongoDB, we use "collections" not "tables"

// 1. User Collection
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  role: { type: String, enum: ['manager', 'member'], default: 'member' },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
  avatar: { type: String }, // Optional profile picture URL
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// 2. Workspace Collection
const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  settings: {
    isPublic: { type: Boolean, default: false },
    allowGuestComments: { type: Boolean, default: true },
  },
}, { timestamps: true });

// 3. Project Collection
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  updates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Update' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  deadline: { type: Date },
  color: { type: String, default: '#3B82F6' }, // Hex color for UI
}, { timestamps: true });

// 4. Update Collection (Async Updates)
const UpdateSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  whatDid: { type: String, required: true }, // What was accomplished
  whatWillDo: { type: String }, // What's planned next
  blockers: { type: String }, // Any obstacles
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['like', 'thumbs_up', 'heart', 'celebrate'], default: 'like' },
  }],
  tags: [{ type: String }], // Custom tags for categorization
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

// 5. Task Collection
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  deadline: { type: Date },
  createdFrom: { type: String, enum: ['manual', 'ai'], default: 'manual' },
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], // Task dependencies
}, { timestamps: true });

// 6. Comment Collection
const CommentSchema = new mongoose.Schema({
  update: { type: mongoose.Schema.Types.ObjectId, ref: 'Update', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // @mentions
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['like', 'thumbs_up', 'heart'], default: 'like' },
  }],
}, { timestamps: true });

// 7. Notification Collection (Optional - for real-time notifications)
const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['update', 'comment', 'task_assigned', 'mention', 'deadline'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of related document
  relatedModel: { type: String, enum: ['Update', 'Comment', 'Task', 'Project'] },
  isRead: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

// Export all models
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const Update = mongoose.models.Update || mongoose.model('Update', UpdateSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// Helper function to create indexes for better performance
export async function createIndexes() {
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });

    // Update indexes for efficient queries
    await Update.collection.createIndex({ project: 1, createdAt: -1 });
    await Update.collection.createIndex({ user: 1, createdAt: -1 });

    // Task indexes
    await Task.collection.createIndex({ project: 1, status: 1 });
    await Task.collection.createIndex({ assignedTo: 1, status: 1 });

    // Comment indexes
    await Comment.collection.createIndex({ update: 1, createdAt: 1 });

    console.log('✅ MongoDB indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}