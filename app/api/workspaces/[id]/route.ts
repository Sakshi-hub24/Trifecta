import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const workspace = await Workspace.findById(id)
      .populate('owner', 'username')
      .populate('members', 'username email')
      .populate('projects', 'name');

    if (!workspace || !workspace.members.map((member: any) => member.toString()).includes(session.user.id)) {
      return NextResponse.json({ error: 'Workspace not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();
    if (!name && !description) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await dbConnect();

    const workspace = await Workspace.findById(id);
    if (!workspace || !workspace.members.map((member: any) => member.toString()).includes(session.user.id)) {
      return NextResponse.json({ error: 'Workspace not found or unauthorized' }, { status: 404 });
    }

    const updated = await Workspace.findByIdAndUpdate(id, { $set: { ...(name ? { name } : {}), ...(description ? { description } : {}) } }, { new: true })
      .populate('owner', 'username')
      .populate('members', 'username email')
      .populate('projects', 'name');

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
