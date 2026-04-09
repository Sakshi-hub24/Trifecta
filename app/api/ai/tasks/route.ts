import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import dbConnect from '@/lib/mongodb';
import Update from '@/models/Update';
import Task from '@/models/Task';
import Project from '@/models/Project';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    await dbConnect();

    const project = await Project.findById(projectId);

    if (!project || !project.members.map((member: any) => member.toString()).includes(session.user.id)) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const updates = await Update.find({ project: projectId })
      .populate('user', 'username')
      .populate('comments', 'content user')
      .sort({ createdAt: -1 })
      .limit(10); // Recent updates

    const text = updates.map(u => {
      const comments = u.comments.map((c: any) => c.content).join(' ');
      return `${u.whatDid} ${u.whatWillDo} ${u.blockers} ${comments}`;
    }).join('\n');

    const prompt = `Extract action items from the following text:\n${text}\n\nReturn a JSON array of tasks with title, assigned user (if mentioned), and optional deadline. Format: [{"title": "Task title", "assignedTo": "username", "deadline": "YYYY-MM-DD"}]` ;

    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
    });

    const response = completion.output_text || completion.output?.map((chunk: any) => {
      if (typeof chunk === 'string') return chunk;
      return chunk?.content?.map((part: any) => part?.text || '').join('');
    }).join('') || '';

    let tasks;
    try {
      tasks = JSON.parse(response || '[]');
    } catch {
      tasks = [];
    }

    // Create tasks in DB
    const createdTasks = [];
    for (const t of tasks) {
      const task = new Task({
        title: t.title,
        project: projectId,
        assignedTo: t.assignedTo ? await findUserByUsername(t.assignedTo) : undefined,
        deadline: t.deadline ? new Date(t.deadline) : undefined,
        createdFrom: 'ai',
      });
      await task.save();
      createdTasks.push(task);
      await Project.findByIdAndUpdate(projectId, { $push: { tasks: task._id } });
    }

    return NextResponse.json(createdTasks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function findUserByUsername(username: string) {
  const User = (await import('@/models/User')).default;
  const user = await User.findOne({ username });
  return user?._id;
}