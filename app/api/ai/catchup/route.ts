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

    // Get recent updates (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const updates = await Update.find({ project: projectId, createdAt: { $gte: sevenDaysAgo } })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    const tasks = await Task.find({ project: projectId, status: { $ne: 'done' } })
      .populate('assignedTo', 'username');

    const activityText = updates.map(u => `Update by ${u.user.username}: ${u.whatDid}`).join('\n');
    const tasksText = tasks.map(t => `Task: ${t.title} assigned to ${t.assignedTo?.username || 'Unassigned'}`).join('\n');

    const prompt = `Catch me up on the project activity:\nUpdates:\n${activityText}\n\nPending Tasks:\n${tasksText}\n\nProvide:\n- What happened\n- Important decisions\n- Pending tasks`;

    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
    });

    const summary = completion.output_text || completion.output?.map((chunk: any) => {
      if (typeof chunk === 'string') return chunk;
      return chunk?.content?.map((part: any) => part?.text || '').join('');
    }).join('') || '';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}