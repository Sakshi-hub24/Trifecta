import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import dbConnect from '@/lib/mongodb';
import Update from '@/models/Update';
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
      .sort({ createdAt: -1 })
      .limit(20); // Last 20 updates

    const updatesText = updates.map(u => `${u.user.username}: ${u.whatDid} | ${u.whatWillDo} | ${u.blockers}`).join('\n');

    const prompt = `Summarize the following team updates:\n${updatesText}\n\nProvide:\n- Key highlights\n- Overall progress\n- Identified blockers`;

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