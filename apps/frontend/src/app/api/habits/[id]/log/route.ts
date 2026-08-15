import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@trackmyhabits/database';
import { evaluateAndFetchBadges } from '@/utils/rewards';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;
    const body = await req.json().catch(() => ({}));

    const targetDate = body.date || new Date().toISOString().split('T')[0];

    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== userId) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    // Check existing log for target date
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId: id,
          date: targetDate,
        },
      },
    });

    let updatedLog;
    if (existingLog) {
      // Toggle completed state
      updatedLog = await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: {
          completed: !existingLog.completed,
        },
      });
    } else {
      // Create new completed log
      updatedLog = await prisma.habitLog.create({
        data: {
          habitId: id,
          userId,
          date: targetDate,
          completed: true,
        },
      });
    }

    // Evaluate badges for user on habit completion
    const { newlyUnlocked } = await evaluateAndFetchBadges(userId);

    return NextResponse.json(
      {
        message: 'Habit log updated successfully',
        log: updatedLog,
        completed: updatedLog.completed,
        newlyUnlocked,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Log habit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update habit log' },
      { status: 500 }
    );
  }
}
