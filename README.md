# Trifecta
# AI Async Copilot

An AI-driven async collaboration platform that replaces meetings with intelligent workflows for global, non-technical teams.

## Features

- **Workspace & Project Management**: Create workspaces and projects, add members.
- **User System**: Simple login/signup with role tagging.
- **Async Update Feed**: Post structured updates (What I did, What I'll do, Blockers), comment and react.
- **AI Smart Summary**: Generate key highlights, progress, and blockers from updates.
- **AI Action Item Generator**: Extract tasks from updates and comments, add to task board.
- **Catch Me Up Feature**: One-click summary of missed activity for global teams.
- **Decision Threads**: Mark discussions as decisions for future reference.
- **Task Board**: Simple Kanban with To Do, In Progress, Done.
- **Smart Notifications**: Basic notifications for updates, comments, mentions.
- **Search & Filter**: Search updates/tasks by user, project, status.
- **Activity Log**: Track updates, tasks, decisions.
- **Clean UI/UX**: Responsive design with sidebar navigation.

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js with credentials
- **AI**: OpenAI API
- **Deployment**: Ready for Vercel/Netlify

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`:
   ```
   MONGODB_URI=mongodb://localhost:27017/ai-async-copilot
   OPENAI_API_KEY=your-openai-api-key
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=http://localhost:3000
   ```
4. Start MongoDB locally or use MongoDB Atlas
5. Run the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/[...nextauth]` - Authentication
- `GET/POST /api/workspaces` - Workspace management
- `GET/POST /api/workspaces/[id]/projects` - Project management
- `GET/POST /api/projects/[id]/updates` - Update feed
- `GET/POST /api/projects/[id]/tasks` - Task board
- `POST /api/ai/summarize` - AI summary generation
- `POST /api/ai/catchup` - Catch up summaries
- `POST /api/ai/tasks` - AI task extraction

## Database Models

- User: email, username, password, role, workspaces
- Workspace: name, owner, members, projects
- Project: name, workspace, members, updates, tasks
- Update: project, user, whatDid, whatWillDo, blockers, comments, reactions
- Task: title, project, assignedTo, status, deadline, createdFrom
- Comment: update, user, content

## Contributing

This is a basic implementation. To add more features:

1. Enhance UI components
2. Add real-time notifications
3. Implement file attachments
4. Add more AI features
5. Improve security and validation

## License

MIT
