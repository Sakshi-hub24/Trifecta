import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Update from '@/models/Update';
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

    const updates = await Update.find({ project: id })
      .populate('user', 'username')
      .populate('comments', 'content user')
      .sort({ createdAt: -1 });

    return NextResponse.json(updates);
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

    const { whatDid, whatWillDo, blockers } = await request.json();

    if (!whatDid) {
      return NextResponse.json({ error: 'What I did is required' }, { status: 400 });
    }

    await dbConnect();

    const project = await Project.findById(id);

    if (!project || !project.members.includes(session.user.id)) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const update = new Update({
      project: id,
      user: session.user.id,
      whatDid,
      whatWillDo,
      blockers,
    });

    await update.save();

    // Add to project's updates
    await Project.findByIdAndUpdate(id, { $push: { updates: update._id } });

    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}