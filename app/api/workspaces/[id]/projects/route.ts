import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Workspace from '@/models/Workspace';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const workspace = await Workspace.findById(id);

    if (!workspace || !workspace.members.map((member: any) => member.toString()).includes(session.user.id)) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const projects = await Project.find({ workspace: id }).populate('members', 'username');

    return NextResponse.json(projects);
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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    await dbConnect();

    const workspace = await Workspace.findById(id);

    if (!workspace || !workspace.members.map((member: any) => member.toString()).includes(session.user.id)) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const project = new Project({
      name,
      workspace: id,
      members: [session.user.id],
    });

    await project.save();

    // Add to workspace's projects
    await Workspace.findByIdAndUpdate(id, { $push: { projects: project._id } });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}