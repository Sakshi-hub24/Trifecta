import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { role } = body as { role?: string };
  const validRoles = ['manager', 'analyst', 'designer'];

  if (!role || !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  user.role = role;
  await user.save();

  return NextResponse.json({ message: 'Role updated successfully', role });
}
