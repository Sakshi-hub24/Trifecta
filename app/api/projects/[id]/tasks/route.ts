import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import Project from '@/models/Project';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const project = await Project.findById(id);

    if (!project || !project.members.map((member: any) => member.toString()).includes(session.user.id)) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const tasks = await Task.find({ project: id }).populate('assignedTo', 'username');

    return NextResponse.json(tasks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, assignedTo, deadline } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    await dbConnect();

    const project = await Project.findById(id);

    if (!project || !project.members.map((member: any) => member.toString()).includes(session.user.id)) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const task = new Task({
      title,
      project: id,
      assignedTo,
      deadline: deadline ? new Date(deadline) : undefined,
    });

    await task.save();

    // Add to project's tasks
    await Project.findByIdAndUpdate(id, { $push: { tasks: task._id } });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}