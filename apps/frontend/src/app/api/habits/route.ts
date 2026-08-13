import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@trackmyhabits/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        logs: true,
      },
    });

    return NextResponse.json({ habits }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch habits error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { title, emoji, color, frequencyType, specificDays } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Habit title is required' }, { status: 400 });
    }

    const newHabit = await prisma.habit.create({
      data: {
        userId,
        title,
        emoji: emoji || '⚡',
        color: color || '#78866B',
        frequencyType: frequencyType || 'daily',
        specificDays: specificDays || null,
        freezesRemaining: 3,
      },
    });

    return NextResponse.json({ message: 'Habit created successfully', habit: newHabit }, { status: 201 });
  } catch (error: any) {
    console.error('Create habit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create habit' },
      { status: 500 }
    );
  }
}
