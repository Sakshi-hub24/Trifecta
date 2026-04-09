# MongoDB Integration Guide for Async Copilot

## 📚 MongoDB vs Relational Databases

### Key Differences:
- **Tables → Collections**: MongoDB uses "collections" instead of tables
- **Rows → Documents**: Data is stored as JSON-like documents, not rows
- **Schema Flexibility**: Documents in the same collection can have different fields
- **Relationships**: Uses references instead of foreign keys (but we use Mongoose for SQL-like queries)

## 🗂️ Collections (Tables) in Async Copilot

### 1. **Users Collection**
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  username: "johndoe",
  password: "hashed_password",
  role: "manager" | "member",
  workspaces: [ObjectId], // References to workspaces
  avatar: "url_to_image",
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **Workspaces Collection**
```javascript
{
  _id: ObjectId,
  name: "My Workspace",
  description: "Team collaboration space",
  owner: ObjectId, // Reference to User
  members: [ObjectId], // Array of User references
  projects: [ObjectId], // Array of Project references
  settings: {
    isPublic: false,
    allowGuestComments: true
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Projects Collection**
```javascript
{
  _id: ObjectId,
  name: "Website Redesign",
  description: "Complete overhaul of company website",
  workspace: ObjectId, // Reference to Workspace
  members: [ObjectId], // Array of User references
  updates: [ObjectId], // Array of Update references
  tasks: [ObjectId], // Array of Task references
  status: "active" | "completed" | "archived",
  deadline: Date,
  color: "#3B82F6",
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **Updates Collection** (Async Updates)
```javascript
{
  _id: ObjectId,
  project: ObjectId, // Reference to Project
  user: ObjectId, // Reference to User who posted
  whatDid: "Completed user authentication system",
  whatWillDo: "Start working on dashboard UI",
  blockers: "Waiting for design approval",
  comments: [ObjectId], // Array of Comment references
  reactions: [{
    user: ObjectId,
    type: "like" | "thumbs_up" | "heart" | "celebrate"
  }],
  tags: ["authentication", "backend"],
  isPinned: false,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **Tasks Collection**
```javascript
{
  _id: ObjectId,
  title: "Implement login form",
  description: "Create responsive login form with validation",
  project: ObjectId, // Reference to Project
  assignedTo: ObjectId, // Reference to User
  createdBy: ObjectId, // Reference to User who created
  status: "todo" | "in_progress" | "review" | "done",
  priority: "low" | "medium" | "high" | "urgent",
  deadline: Date,
  createdFrom: "manual" | "ai",
  estimatedHours: 4,
  actualHours: 2,
  dependencies: [ObjectId], // Array of Task references
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **Comments Collection**
```javascript
{
  _id: ObjectId,
  update: ObjectId, // Reference to Update
  user: ObjectId, // Reference to User who commented
  content: "Great progress! The authentication looks solid.",
  mentions: [ObjectId], // Array of mentioned User references
  reactions: [{
    user: ObjectId,
    type: "like" | "thumbs_up" | "heart"
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **Notifications Collection**
```javascript
{
  _id: ObjectId,
  user: ObjectId, // Reference to User
  type: "update" | "comment" | "task_assigned" | "mention" | "deadline",
  title: "New comment on your update",
  message: "John Doe commented on your update",
  relatedId: ObjectId, // ID of related document
  relatedModel: "Update" | "Comment" | "Task" | "Project",
  isRead: false,
  priority: "low" | "medium" | "high",
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 How to Create Collections in MongoDB

### Method 1: Automatic (Recommended)
Collections are created automatically when you first save a document:

```javascript
import { User } from '@/lib/database-schema';

// This creates the 'users' collection automatically
const newUser = new User({
  email: 'user@example.com',
  username: 'johndoe',
  password: 'hashed_password'
});

await newUser.save();
```

### Method 2: Using MongoDB Shell
```bash
# Connect to MongoDB
mongosh "your_mongodb_connection_string"

# Switch to your database
use your_database_name

# Create collections explicitly
db.createCollection("users")
db.createCollection("workspaces")
db.createCollection("projects")
db.createCollection("updates")
db.createCollection("tasks")
db.createCollection("comments")
db.createCollection("notifications")
```

### Method 3: Using the Initialization Script
```bash
# Run the database initialization script
npm run init-db
```

## 📊 Database Indexes for Performance

The following indexes are automatically created for optimal performance:

```javascript
// User indexes
{ email: 1 } // Unique index for email login
{ username: 1 } // Unique index for username lookup

// Update indexes
{ project: 1, createdAt: -1 } // Fast project updates by date
{ user: 1, createdAt: -1 } // Fast user updates by date

// Task indexes
{ project: 1, status: 1 } // Fast task filtering by project and status
{ assignedTo: 1, status: 1 } // Fast task filtering by assignee and status

// Comment indexes
{ update: 1, createdAt: 1 } // Fast comments for specific updates
```

## 🔧 Working with Collections

### Creating Documents
```javascript
import { User, Workspace, Project } from '@/lib/database-schema';

// Create a user
const user = new User({
  email: 'john@example.com',
  username: 'john',
  password: await bcrypt.hash('password123', 12)
});
await user.save();

// Create a workspace
const workspace = new Workspace({
  name: 'My Team',
  owner: user._id,
  members: [user._id]
});
await workspace.save();

// Create a project
const project = new Project({
  name: 'New Feature',
  workspace: workspace._id,
  members: [user._id]
});
await project.save();
```

### Querying Documents
```javascript
// Find user by email
const user = await User.findOne({ email: 'john@example.com' });

// Find all projects in a workspace
const projects = await Project.find({ workspace: workspaceId });

// Find updates with comments
const updates = await Update.find({ project: projectId })
  .populate('user', 'username')
  .populate('comments')
  .sort({ createdAt: -1 });
```

### Updating Documents
```javascript
// Update user profile
await User.findByIdAndUpdate(userId, {
  avatar: 'new-avatar-url.jpg'
});

// Add member to workspace
await Workspace.findByIdAndUpdate(workspaceId, {
  $push: { members: newMemberId }
});
```

### Deleting Documents
```javascript
// Delete a task
await Task.findByIdAndDelete(taskId);

// Remove project from workspace
await Workspace.findByIdAndUpdate(workspaceId, {
  $pull: { projects: projectId }
});
```

## 🛠️ Step-by-Step Setup Guide

### Step 1: Environment Setup
1. Ensure MongoDB URI is set in `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Database
```bash
# This creates collections, indexes, and sample data
npm run init-db
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Verify Setup
- Check MongoDB Atlas/dashboard for created collections
- Try creating a user account through the app
- Verify data appears in the correct collections

## 🔍 Troubleshooting

### Common Issues:

1. **"Collection not found" error**
   - Collections are created automatically on first document save
   - Run `npm run init-db` to create them explicitly

2. **Connection timeout**
   - Check MongoDB URI in `.env.local`
   - Ensure IP whitelist includes your IP
   - Verify network connectivity

3. **Validation errors**
   - Check required fields in schema
   - Ensure references point to existing documents

4. **Performance issues**
   - Indexes may need to be created: `npm run init-db`
   - Check MongoDB Atlas performance metrics

## 📈 Scaling Considerations

- **Indexes**: Regularly monitor and optimize query performance
- **Sharding**: For large datasets, consider sharding collections
- **Caching**: Implement Redis for frequently accessed data
- **Backup**: Set up automated backups in MongoDB Atlas

## 🔗 Useful Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas](https://cloud.mongodb.com/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/core/)