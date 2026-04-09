import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, role } = await request.json();

    if (!email || !username || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email,
      username,
      password: hashedPassword,
      role,
    });

    await user.save();

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}