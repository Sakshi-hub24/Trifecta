import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import User from '@/models/User';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    const workspace = await Workspace.findById(id);
    if (!workspace || !workspace.members.map((member: any) => member.toString()).includes(session.user.id)) {
      return NextResponse.json({ error: 'Workspace not found or unauthorized' }, { status: 404 });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userToAdd._id.toString();
    if (workspace.members.map((member: any) => member.toString()).includes(userId)) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    await Workspace.findByIdAndUpdate(id, { $addToSet: { members: userToAdd._id } });
    await User.findByIdAndUpdate(userToAdd._id, { $addToSet: { workspaces: workspace._id } });

    const updatedWorkspace = await Workspace.findById(id).populate('owner', 'username').populate('members', 'username email');
    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
