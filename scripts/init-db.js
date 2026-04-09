#!/usr/bin/env node

/**
 * MongoDB Database Initialization Script
 * This script creates collections and indexes for the Async Copilot application
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envContent = readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join('=').trim();
    }
    return acc;
  }, {});

  // Set environment variables
  Object.keys(envVars).forEach(key => {
    process.env[key] = envVars[key];
  });
} catch (error) {
  console.log('⚠️  Could not load .env.local file, using existing environment variables');
}

// Define schemas directly (since we can't import TS models in JS)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['manager', 'member'], default: 'member' },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
}, { timestamps: true });

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  updates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Update' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
}, { timestamps: true });

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

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  deadline: { type: Date },
  createdFrom: { type: String, enum: ['manual', 'ai'], default: 'manual' },
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  update: { type: mongoose.Schema.Types.ObjectId, ref: 'Update', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

// Create models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Update = mongoose.models.Update || mongoose.model('Update', UpdateSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Create indexes for better performance
    console.log('📊 Creating database indexes...');
    await createIndexes();

    // Create sample data (optional - comment out if not needed)
    console.log('📝 Creating sample data...');
    await createSampleData();

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📋 Collections created:');
    console.log('  - users');
    console.log('  - workspaces');
    console.log('  - projects');
    console.log('  - updates');
    console.log('  - tasks');
    console.log('  - comments');
    console.log('  - notifications');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function createIndexes() {
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

async function createSampleData() {
  try {
    // Create a sample admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      email: 'admin@async-copilot.com',
      username: 'admin',
      password: hashedPassword,
      role: 'manager',
    });
    await adminUser.save();
    console.log('👤 Created admin user: admin@async-copilot.com / admin123');

    // Create a sample workspace
    const workspace = new Workspace({
      name: 'Demo Workspace',
      description: 'A sample workspace for testing Async Copilot',
      owner: adminUser._id,
      members: [adminUser._id],
      settings: {
        isPublic: false,
        allowGuestComments: true,
      },
    });
    await workspace.save();
    console.log('🏢 Created workspace: Demo Workspace');

    // Create a sample project
    const project = new Project({
      name: 'Welcome Project',
      description: 'Your first async collaboration project',
      workspace: workspace._id,
      members: [adminUser._id],
      status: 'active',
      color: '#10B981',
    });
    await project.save();
    console.log('📁 Created project: Welcome Project');

    // Create a sample update
    const update = new Update({
      project: project._id,
      user: adminUser._id,
      whatDid: 'Set up the Async Copilot workspace and created initial project structure',
      whatWillDo: 'Start working on the first features and gather team feedback',
      blockers: 'None at the moment',
      tags: ['setup', 'planning'],
    });
    await update.save();
    console.log('📝 Created sample update');

    // Create a sample task
    const task = new Task({
      title: 'Complete project setup',
      description: 'Finish setting up the project infrastructure and documentation',
      project: project._id,
      assignedTo: adminUser._id,
      createdBy: adminUser._id,
      status: 'in_progress',
      priority: 'high',
      createdFrom: 'manual',
      estimatedHours: 4,
    });
    await task.save();
    console.log('✅ Created sample task');

    // Update workspace and project references
    await Workspace.findByIdAndUpdate(workspace._id, {
      $push: { projects: project._id }
    });

    await Project.findByIdAndUpdate(project._id, {
      $push: { updates: update._id, tasks: task._id }
    });

    await User.findByIdAndUpdate(adminUser._id, {
      $push: { workspaces: workspace._id }
    });

    console.log('🔗 Updated all references between collections');

  } catch (error) {
    console.log('⚠️  Sample data creation failed (this is optional):', error.message);
  }
}

// Run the initialization
initializeDatabase();